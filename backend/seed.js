const db = require('./db');
const bcrypt = require('bcrypt');

const seedData = async () => {
    try {
        console.log('🌱 Starting seed...');

        // 1. Create a Recruiter
        const hashedPassword = await bcrypt.hash('password123', 10);
        const recruiterEmail = 'recruiter@techgiants.com';

        // check if exists
        const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [recruiterEmail]);
        let recruiterId;

        if (users.length === 0) {
            const [res] = await db.execute(
                'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
                [recruiterEmail, hashedPassword, 'recruiter', 'Alex', 'Hirsch']
            );
            recruiterId = res.insertId;
            console.log('Created Recruiter:', recruiterEmail);
        } else {
            recruiterId = users[0].id;
            console.log('Recruiter already exists, using ID:', recruiterId);
        }

        // 2. Clear existing jobs to prevent duplicates and ensure clean state
        console.log('🧹 Clearing existing jobs for this recruiter...');
        await db.execute('DELETE FROM jobs WHERE recruiter_id = ?', [recruiterId]);

        // 3. Define Real Jobs (and ensure saved_jobs table exists)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS saved_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                job_id INT NOT NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_save (user_id, job_id)
            )
        `);

        const jobs = [
            {
                title: 'Senior Full Stack Engineer',
                company: 'Netflix',
                location: 'Remote (US)',
                min: 180000,
                max: 240000,
                level: 'senior',
                desc: 'We are looking for a Senior Full Stack Engineer to help us build the next generation of our content delivery platform. You will work with React, Node.js, and GraphQL to build scalable services.',
                skills: ['React', 'Node.js', 'GraphQL', 'AWS']
            },
            {
                title: 'Product Designer',
                company: 'Linear',
                location: 'San Francisco, CA',
                min: 130000,
                max: 170000,
                level: 'mid',
                desc: 'Design beautiful, intuitive interfaces for our project management tools. You should have a strong portfolio showcasing your attention to detail and ability to simplify complex workflows.',
                skills: ['Figma', 'UI/UX', 'Prototyping']
            },
            {
                title: 'Backend Developer (Go)',
                company: 'Uber',
                location: 'New York, NY',
                min: 150000,
                max: 200000,
                level: 'mid',
                desc: 'Join our core infrastructure team to build high-performance microservices in Go. You will deal with massive scale and concurrency challenges.',
                skills: ['Go', 'Microservices', 'Distributed Systems', 'Docker']
            },
            {
                title: 'Frontend Engineer',
                company: 'Vercel',
                location: 'Remote',
                min: 120000,
                max: 160000,
                level: 'mid',
                desc: 'Help us build the best developer experience on the web. You will work on Next.js core and our deployment platform dashboard.',
                skills: ['React', 'Next.js', 'TypeScript', 'CSS']
            },
            {
                title: 'Machine Learning Engineer',
                company: 'OpenAI',
                location: 'San Francisco, CA',
                min: 200000,
                max: 350000,
                level: 'senior',
                desc: 'Work on cutting-edge language models. You should have deep knowledge of PyTorch, extensive experience with transformers, and a passion for AGI.',
                skills: ['Python', 'PyTorch', 'Machine Learning', 'CUDA']
            },
            {
                title: 'Junior DevOps Engineer',
                company: 'Shopify',
                location: 'Ottawa, Canada',
                min: 80000,
                max: 110000,
                level: 'entry',
                desc: 'Start your career managing cloud infrastructure at scale. You will learn Kubernetes, Terraform, and CI/CD pipelines.',
                skills: ['AWS', 'Linux', 'Bash', 'Docker']
            },
            {
                title: 'Staff Software Engineer',
                company: 'Discord',
                location: 'San Francisco, CA',
                min: 220000,
                max: 300000,
                level: 'lead',
                desc: 'Lead the architecture of our real-time voice and video infrastructure. You will mentor senior engineers and drive technical strategy.',
                skills: ['C++', 'WebRTC', 'System Design', 'Leadership']
            }
        ];

        // 4. Insert Skills & Jobs
        for (const job of jobs) {
            // Insert Job
            const [jobRes] = await db.execute(
                `INSERT INTO jobs (recruiter_id, title, description, company_name, location, salary_min, salary_max, experience_level) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [recruiterId, job.title, job.desc, job.company, job.location, job.min, job.max, job.level]
            );
            const jobId = jobRes.insertId;
            console.log(`> Added Job: ${job.title} at ${job.company}`);

            // Handle Skills
            for (const skillName of job.skills) {
                // Ensure skill exists
                let skillId;
                const [existingSkills] = await db.execute('SELECT id FROM skills WHERE name = ?', [skillName]);

                if (existingSkills.length > 0) {
                    skillId = existingSkills[0].id;
                } else {
                    try {
                        const [sRes] = await db.execute('INSERT INTO skills (name) VALUES (?)', [skillName]);
                        skillId = sRes.insertId;
                    } catch (e) {
                        // Race condition fallback
                        const [retry] = await db.execute('SELECT id FROM skills WHERE name = ?', [skillName]);
                        skillId = retry[0].id;
                    }
                }

                // Link Job to Skill
                await db.execute('INSERT IGNORE INTO job_skills (job_id, skill_id) VALUES (?, ?)', [jobId, skillId]);
            }
        }

        console.log(' Seed complete!');
        process.exit(0);

    } catch (err) {
        console.error(' Seed failed:', err);
        process.exit(1);
    }
};

seedData();
