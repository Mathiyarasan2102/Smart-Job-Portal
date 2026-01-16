import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';

const PostJob = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        location: '',
        salary_min: '',
        salary_max: '',
        experience_level: 'entry',
        description: '',
        skills: '' 
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                // Redirect to job detail or list
                toast.success('Job posted successfully!');
                navigate(`/jobs/${data.jobId}`);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            console.error(err);
            toast.error('Error posting job');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container animate-enter max-w-200 mx-auto">
            <h1 className="mb-8 text-center">Post a New Opportunity</h1>

            <form onSubmit={handleSubmit} className="bg-bg-card p-10 rounded-xl border border-border-light grid gap-6">

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2">Job Title</label>
                        <input className="w-full bg-transparent border border-border-light rounded p-2 text-white" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Senior Backend Engineer" />
                    </div>
                    <div>
                        <label className="block mb-2">Company Name</label>
                        <input className="w-full bg-transparent border border-border-light rounded p-2 text-white" name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="e.g. Acme Corp" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2">Location</label>
                        <input className="w-full bg-transparent border border-border-light rounded p-2 text-white" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. Remote, San Francisco" />
                    </div>
                    <div>
                        <label className="block mb-2">Experience Level</label>
                        <div className="custom-select-wrapper">
                            <select name="experience_level" value={formData.experience_level} onChange={handleChange} className="w-full h-12 bg-bg-card border border-border-light rounded px-2 text-white">
                                <option value="entry">Entry Level</option>
                                <option value="mid">Mid Level</option>
                                <option value="senior">Senior Level</option>
                                <option value="lead">Lead / Manager</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2">Min Salary</label>
                        <input className="w-full bg-transparent border border-border-light rounded p-2 text-white" min="0" name="salary_min" type="number" value={formData.salary_min} onChange={handleChange} placeholder="e.g. 50000" />
                    </div>
                    <div>
                        <label className="block mb-2">Max Salary</label>
                        <input className="w-full bg-transparent border border-border-light rounded p-2 text-white" min="0" name="salary_max" type="number" value={formData.salary_max} onChange={handleChange} placeholder="e.g. 80000" />
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Skills (Comma Separated)</label>
                    <input className="w-full bg-transparent border border-border-light rounded p-2 text-white" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. Node.js, React, SQL" />
                    <p className="text-xs text-[#666] mt-2">Used for matching candidates.</p>
                </div>

                <div>
                    <label className="block mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={8}
                        placeholder="Describe the role, responsibilities, and perks..."
                        className="w-full bg-transparent border border-border-light rounded p-2 text-white resize-y"
                    />
                </div>

                <button type="submit" className="btn btn-primary justify-self-start px-12" disabled={loading}>
                    {loading ? 'Publishing...' : 'Publish Job'}
                </button>

            </form>
        </div>
    );
};

export default PostJob;
