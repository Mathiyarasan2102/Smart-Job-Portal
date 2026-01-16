const db = require('../db');

exports.toggleSaveJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const userId = req.user.id;

        // Check if already saved
        const [existing] = await db.execute(
            'SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?',
            [userId, jobId]
        );

        if (existing.length > 0) {
            // Unsave
            await db.execute('DELETE FROM saved_jobs WHERE id = ?', [existing[0].id]);
            return res.status(200).json({ status: 'success', saved: false });
        } else {
            // Save
            await db.execute('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [userId, jobId]);
            return res.status(200).json({ status: 'success', saved: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error toggling save job' });
    }
};

exports.getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const [jobsRaw] = await db.execute(`
            SELECT j.*, u.first_name as recruiter_name, GROUP_CONCAT(s.name) as skills_string
            FROM saved_jobs sj
            JOIN jobs j ON sj.job_id = j.id
            JOIN users u ON j.recruiter_id = u.id
            LEFT JOIN job_skills js ON j.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            WHERE sj.user_id = ?
            GROUP BY j.id
        `, [userId]);

        const jobs = jobsRaw.map(job => ({
            ...job,
            skills: job.skills_string ? job.skills_string.split(',') : []
        }));

        res.status(200).json({ status: 'success', data: { jobs } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching saved jobs' });
    }
};
