const db = require('../db');


exports.getAllJobs = async (req, res) => {

    const { page = 1, limit = 10, search, location, experience, skills, sort, ids } = req.query;

    try {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        // Build shared WHERE clause and parameters
        let whereConditions = ["1=1"];
        const queryParams = [];

        // 1. Keyword Search
        if (search) {
            whereConditions.push("(j.title LIKE ? OR j.company_name LIKE ? OR s.name LIKE ?)");
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // 2. Multi-Select Location (Partial Matches)
        // usage: ?location=New York,San Francisco
        if (location) {
            const locs = location.split(',').map(l => l.trim()).filter(l => l);
            if (locs.length > 0) {
                // (j.location LIKE ? OR j.location LIKE ?)
                const locOr = locs.map(() => "j.location LIKE ?").join(" OR ");
                whereConditions.push(`(${locOr})`);
                locs.forEach(l => queryParams.push(`%${l}%`));
            }
        }

        // 3. Multi-Select Experience (Exact Matches)
        // usage: ?experience=entry,mid
        if (experience) {
            const exps = experience.split(',').map(e => e.trim()).filter(e => e);
            if (exps.length > 0) {
                const placeholders = exps.map(() => '?').join(',');
                whereConditions.push(`j.experience_level IN (${placeholders})`);
                queryParams.push(...exps);
            }
        }

        // 4. Saved Jobs IDs
        if (ids) {
            const idList = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (idList.length > 0) {
                const placeholders = idList.map(() => '?').join(',');
                whereConditions.push(`j.id IN (${placeholders})`);
                queryParams.push(...idList);
            } else {
                whereConditions.push("1=0");
            }
        }

        // 5. Multi-Select Skills (Jobs that have ALL selected skills)
        // usage: ?skills=JavaScript,React
        if (skills) {
            const skillList = skills.split(',').map(s => s.trim()).filter(s => s);
            if (skillList.length > 0) {
                const placeholders = skillList.map(() => '?').join(',');
                whereConditions.push(`
                    EXISTS (
                        SELECT 1 FROM job_skills js2 
                        JOIN skills s2 ON js2.skill_id = s2.id 
                        WHERE js2.job_id = j.id AND s2.name IN (${placeholders})
                    )
                `);
                queryParams.push(...skillList);
            }
        }

        const whereClause = "WHERE " + whereConditions.join(" AND ");

        // 1. Get Total Count (Correctly filtering distinct jobs)
        const countSql = `
            SELECT COUNT(DISTINCT j.id) as total
            FROM jobs j
            JOIN users u ON j.recruiter_id = u.id
            LEFT JOIN job_skills js ON j.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            ${whereClause}
        `;

        const [countResult] = await db.execute(countSql, queryParams);
        const total = countResult[0].total;

        // 2. Get Data with sorting and pagination
        let dataSql;
        let dataParams;

        // Base fields
        const selectFields = `
            j.*, u.first_name as recruiter_name, 
            GROUP_CONCAT(DISTINCT s.name) as skills_string,
            COUNT(DISTINCT all_apps.id) as application_count,
            ${req.user ? "MAX(CASE WHEN my_app.id IS NOT NULL THEN 1 ELSE 0 END) as has_applied" : "0 as has_applied"}
        `;

        const joins = `
            FROM jobs j 
            JOIN users u ON j.recruiter_id = u.id
            LEFT JOIN job_skills js ON j.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            LEFT JOIN applications all_apps ON j.id = all_apps.job_id
            ${req.user ? "LEFT JOIN applications my_app ON j.id = my_app.job_id AND my_app.candidate_id = ?" : ""}
        `;

        dataSql = `SELECT ${selectFields} ${joins} ${whereClause} GROUP BY j.id, u.first_name`;

        // Param construction
        dataParams = req.user ? [req.user.id, ...queryParams] : [...queryParams];

        const validSorts = ['created_at', 'salary_max'];
        const [field, order] = (sort || 'created_at-desc').split('-');
        if (validSorts.includes(field)) {
            dataSql += ` ORDER BY j.${field} ${order === 'asc' ? 'ASC' : 'DESC'}`;
        } else {
            dataSql += ` ORDER BY j.created_at DESC`;
        }

        dataSql += ` LIMIT ${limitNum} OFFSET ${offset}`;

        const [jobsRaw] = await db.execute(dataSql, dataParams);

        const jobs = jobsRaw.map(job => ({
            ...job,
            skills: job.skills_string ? job.skills_string.split(',') : [],
            has_applied: !!job.has_applied
        }));

        res.status(200).json({
            status: 'success',
            results: jobs.length,
            total: total,
            data: { jobs }
        });

    } catch (err) {
        console.error("DB Error in getAllJobs:", err.message);
        console.error("Failed Query QueryArgs:", req.query);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching jobs.'
        });
    }
};

exports.getJob = async (req, res) => {
    try {
        let sql;
        let params;

        if (req.user) {
            sql = `
                SELECT j.*, u.first_name as recruiter_name, u.email as recruiter_email,
                (CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END) as has_applied
                FROM jobs j
                JOIN users u ON j.recruiter_id = u.id
                LEFT JOIN applications a ON j.id = a.job_id AND a.candidate_id = ?
                WHERE j.id = ?
            `;
            params = [req.user.id, req.params.id];
        } else {
            sql = `
                SELECT j.*, u.first_name as recruiter_name, u.email as recruiter_email,
                0 as has_applied
                FROM jobs j
                JOIN users u ON j.recruiter_id = u.id
                WHERE j.id = ?
            `;
            params = [req.params.id];
        }

        const [rows] = await db.execute(sql, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const [skills] = await db.execute(`
            SELECT s.name FROM skills s
            JOIN job_skills js ON s.id = js.skill_id
            WHERE js.job_id = ?
        `, [req.params.id]);

        const job = rows[0];
        job.skills = skills.map(s => s.name);
        job.has_applied = !!job.has_applied;

        res.status(200).json({
            status: 'success',
            data: { job }
        });
    } catch (err) {
        console.error("DB Error:", err.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching job details.'
        });
    }
};

exports.createJob = async (req, res) => {
    try {
        const { title, description, company_name, location, salary_min, salary_max, experience_level, skills } = req.body;

        if (!title || !description || !company_name || !location) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.execute(`
                INSERT INTO jobs (recruiter_id, title, description, company_name, location, salary_min, salary_max, experience_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [req.user.id, title, description, company_name, location, salary_min, salary_max, experience_level]);

            const jobId = result.insertId;

            if (skills && Array.isArray(skills)) {
                for (const skillName of skills) {
                    let [skillRows] = await connection.execute('SELECT id FROM skills WHERE name = ?', [skillName]);
                    let skillId;

                    if (skillRows.length === 0) {
                        const [newSkill] = await connection.execute('INSERT INTO skills (name) VALUES (?)', [skillName]);
                        skillId = newSkill.insertId;
                    } else {
                        skillId = skillRows[0].id;
                    }

                    await connection.execute('INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)', [jobId, skillId]);
                }
            }

            await connection.commit();
            res.status(201).json({ status: 'success', message: 'Job created', jobId });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating job.'
        });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const recruiterId = req.user.id;

        const [job] = await db.execute('SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]);

        if (job.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job[0].recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'You are not authorized to delete this job' });
        }

        await db.execute('DELETE FROM jobs WHERE id = ?', [jobId]);

        res.status(200).json({ status: 'success', message: 'Job deleted successfully' });

    } catch (err) {
        console.error("DB Error in deleteJob:", err.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting job.'
        });
    }
};
