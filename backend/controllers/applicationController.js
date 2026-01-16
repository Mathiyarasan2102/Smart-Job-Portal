const multer = require('multer');
const path = require('path');
const db = require('../db');

// Multer Storage Configuration

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Security: timestamp + random suffix to prevent overwriting
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Docx allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter
});

exports.uploadResume = upload.single('resume');

exports.applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const candidateId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a resume' });
        }

        const resumeUrl = req.file.path; // Storing relative path

        const [existing] = await db.execute(
            'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
            [jobId, candidateId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already applied to this job' });
        }

        await db.execute(
            'INSERT INTO applications (job_id, candidate_id, resume_url) VALUES (?, ?, ?)',
            [jobId, candidateId, resumeUrl]
        );

        res.status(201).json({ status: 'success', message: 'Application submitted' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error applying to job' });
    }
};

exports.getJobApplications = async (req, res) => {
    try {
        // Recruiter only - ensure they own the job
        const { jobId } = req.params;
        const recruiterId = req.user.id;
        const { page = 1, limit = 10, status, sort } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        // Verify ownership
        const [job] = await db.execute('SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]);
        if (job.length === 0 || job[0].recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Base Query
        let baseSql = `
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            WHERE a.job_id = ?
        `;
        const queryParams = [jobId];

        // Filter by Status
        if (status) {
            baseSql += ` AND a.status = ?`;
            queryParams.push(status);
        }

        // Count Total
        const [countResult] = await db.execute(`SELECT COUNT(*) as total ${baseSql}`, queryParams);
        const total = countResult[0].total;

        // Sorting
        let orderBy = 'ORDER BY a.applied_at DESC';
        if (sort) {
            const [field, order] = sort.split('-');
            const validFields = ['applied_at', 'status', 'first_name'];
            if (validFields.includes(field)) {
                // Handle name sorting which is on joined table
                const colName = field === 'first_name' ? 'u.first_name' : `a.${field}`;
                orderBy = `ORDER BY ${colName} ${order === 'asc' ? 'ASC' : 'DESC'}`;
            }
        }

        // Fetch Data
        const sql = `
            SELECT a.*, u.first_name, u.last_name, u.email 
            ${baseSql}
            ${orderBy}
            LIMIT ${limitNum} OFFSET ${offset}
        `;

        const [applications] = await db.execute(sql, queryParams);

        res.status(200).json({
            status: 'success',
            results: applications.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: { applications }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching applications' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;

        await db.execute('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);
        res.status(200).json({ status: 'success', message: 'Status updated' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating status' });
    }
};

exports.getCandidateApplications = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const [applications] = await db.execute(`
            SELECT a.*, j.title, j.company_name, j.location
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.candidate_id = ?
            ORDER BY a.applied_at DESC
        `, [candidateId]);

        res.status(200).json({
            status: 'success',
            results: applications.length,
            data: { applications }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching applications' });
    }
};

exports.getRecruiterStats = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        // 1. Fetch Raw Data (Last 33 Days to cover timezone edges)
        const [apps] = await db.execute(`
            SELECT a.applied_at
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = ? AND a.applied_at >= DATE_SUB(NOW(), INTERVAL 33 DAY)
        `, [recruiterId]);

        const [jobsVals] = await db.execute(`
            SELECT created_at
            FROM jobs
            WHERE recruiter_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 33 DAY)
        `, [recruiterId]);

        // 2. Prepare 30-Day Timeline (IST)
        const statsMap = {};

        // Generate Keys for Last 30 Days (IST aligned)
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            // Shift current server time (UTC) to IST (UTC+5:30)
            d.setUTCMinutes(d.getUTCMinutes() + 330);
            d.setUTCDate(d.getUTCDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            statsMap[dateStr] = { date: dateStr, apps: 0, jobs: 0 };
        }

        // 3. Bucket Data Helper
        const bucketData = (list, dateField, key) => {
            list.forEach(item => {
                const dateVal = item[dateField];
                if (!dateVal) return;

                const d = new Date(dateVal);
                // Shift UTC timestamp to IST time values
                d.setUTCMinutes(d.getUTCMinutes() + 330);

                // Get the 'local' date string which is now effectively IST date
                const dateStr = d.toISOString().split('T')[0];

                if (statsMap[dateStr]) {
                    statsMap[dateStr][key]++;
                }
            });
        };

        bucketData(apps, 'applied_at', 'apps');
        bucketData(jobsVals, 'created_at', 'jobs');

        // Convert to array and sort
        const trend = Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));

        res.status(200).json({
            status: 'success',
            data: { trend }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
