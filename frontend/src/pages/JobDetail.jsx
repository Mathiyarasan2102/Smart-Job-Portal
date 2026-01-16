import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, IndianRupee, Briefcase, Share2, UploadCloud, CheckCircle, X, ExternalLink, Calendar, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

const JobDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [relatedJobs, setRelatedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const fetchJobAndRelated = async () => {
            setLoading(true);
            try {
                // Pass token if available to cheek application status
                const headers = {};
                const token = localStorage.getItem('token');
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${id}`, { headers });
                const data = await res.json();
                if (data.status === 'success') {
                    setJob(data.data.job);

                    // Check saved status
                    if (user) {
                        try {
                            const savedRes = await fetch(`${import.meta.env.VITE_API_URL}/api/saved-jobs`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            const savedData = await savedRes.json();
                            if (savedData.status === 'success') {
                                setIsSaved(savedData.data.jobs.some(j => j.id === parseInt(id)));
                            }
                        } catch (e) { console.error(e); }
                    } else {
                        const localSaved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
                        setIsSaved(localSaved.includes(parseInt(id)));
                    }

                    // Fetch Related Jobs (Based on location first, fallback to recent)
                    let relatedRes = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs?location=${data.data.job.location}&limit=4`); // limit 4 to exclude self
                    let relatedData = await relatedRes.json();
                    let relatedList = relatedData.status === 'success' ? relatedData.data.jobs.filter(j => j.id !== parseInt(id)) : [];

                    // Fallback: If no related jobs by location, fetch recent jobs
                    if (relatedList.length === 0) {
                        relatedRes = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs?limit=3&sort=created_at-desc`);
                        relatedData = await relatedRes.json();
                        if (relatedData.status === 'success') {
                            relatedList = relatedData.data.jobs.filter(j => j.id !== parseInt(id));
                        }
                    }

                    setRelatedJobs(relatedList.slice(0, 3));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobAndRelated();
    }, [id, user]);

    const handleToggleSave = async () => {
        const jobId = parseInt(id);
        if (!user) {
            const localSaved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
            let newSaved;
            if (isSaved) {
                newSaved = localSaved.filter(j => j !== jobId);
                toast.success("Job removed from saved");
            } else {
                newSaved = [...localSaved, jobId];
                toast.success("Job saved locally");
            }
            localStorage.setItem('savedJobs', JSON.stringify(newSaved));
            setIsSaved(!isSaved);
            return;
        }

        // Optimistic
        setIsSaved(!isSaved);

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/saved-jobs/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ jobId })
            });
            toast.success(!isSaved ? "Job saved" : "Job removed");
        } catch (err) {
            setIsSaved(isSaved); // Revert
            toast.error("Failed to update");
            console.error("Failed to save", err);
        }
    };

    if (loading) return <div className="container mt-16">Loading...</div>;
    if (!job) return <div className="container mt-16">Job not found</div>;

    return (
        <div className="container animate-enter max-w-300 mt-8">
            <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-12">

                {/* Main Content */}
                <div>
                    {/* Header */}
                    <div className="bg-bg-card border border-border-light rounded-xl p-12 relative overflow-hidden mb-8">
                        <div className="absolute top-0 left-0 w-full h-1 bg-text-accent"></div>

                        <div className="flex justify-between items-start flex-wrap gap-8">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h5 className="text-text-accent uppercase tracking-[0.05em] m-0">{job.company_name}</h5>
                                    <span className="text-xs text-[#666] flex items-center gap-[0.3rem]">
                                        <Calendar size={12} /> Posted {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h1 className="text-[2.5rem] leading-[1.2] mb-6">{job.title}</h1>

                                <div className="flex gap-6 text-[#aaa] text-[1rem]">
                                    <span className="flex items-center gap-2"><MapPin size={18} /> {job.location}</span>
                                    <span className="flex items-center gap-2"><Briefcase size={18} /> {job.experience_level}</span>
                                    {job.salary_min && (
                                        <span className="flex items-center gap-2"><IndianRupee size={18} /> ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    className={`btn ${isSaved ? 'bg-text-accent text-black border-text-accent' : 'btn-outline'}`}
                                    title={isSaved ? "Unsave" : "Save"}
                                    onClick={handleToggleSave}
                                >
                                    <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                                </button>

                                <button className="btn btn-outline" title="Share" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Link copied!');
                                }}>
                                    <Share2 size={20} />
                                </button>

                                {job.has_applied ? (
                                    <button className="btn btn-primary opacity-50 cursor-not-allowed border-green-500 bg-green-500/20 text-green-500" disabled>
                                        <CheckCircle size={16} className="mr-2" /> Applied
                                    </button>
                                ) : user?.role === 'candidate' ? (
                                    <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
                                        Apply Now
                                    </button>
                                ) : user?.role === 'recruiter' ? (
                                    <div className="p-[0.8rem] bg-[#333] rounded text-sm">Recruiter View</div>
                                ) : (
                                    <Link to="/login" className="btn btn-primary">Login to Apply</Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-[1.1rem] text-[#ddd] leading-[1.8]">
                        <h3 className="mb-4 text-white">About the Role</h3>
                        <p className="whitespace-pre-wrap">{job.description}</p>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="flex flex-col gap-8">

                    {/* Skills */}
                    <div className="bg-bg-card p-8 rounded-lg border border-border-light">
                        <h4 className="mb-6">Skills Required</h4>
                        <div className="flex flex-wrap gap-2">
                            {job.skills && job.skills.map((skill, i) => (
                                <span key={i} className="bg-white/5 py-[0.4rem] px-[0.8rem] rounded text-[0.9rem] border border-white/10">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Company Profile */}
                    <div className="bg-bg-card p-8 rounded-lg border border-border-light">
                        <h4 className="mb-4">About {job.company_name}</h4>
                        <div className="w-12.5 h-12.5 bg-[#333] rounded-full flex items-center justify-center mb-4 font-bold text-[1.5rem]">
                            {job.company_name.charAt(0)}
                        </div>
                        <p className="text-[#aaa] text-[0.9rem] mb-4">
                            Leading the industry in innovation and tech. Join us to build the future.
                        </p>
                        <a href="#" className="text-text-accent flex items-center gap-2 text-[0.9rem]">
                            Visit Website <ExternalLink size={14} />
                        </a>
                    </div>

                    {/* Related Jobs */}
                    {relatedJobs.length > 0 && (
                        <div className="bg-bg-card p-8 rounded-lg border border-border-light">
                            <h4 className="mb-4">Related Jobs</h4>
                            <div className="flex flex-col gap-4">
                                {relatedJobs.map(j => (
                                    <Link key={j.id} to={`/jobs/${j.id}`} className="hover-lift block p-4 bg-[#222] rounded decoration-0">
                                        <div className="font-bold mb-[0.2rem]">{j.title}</div>
                                        <div className="text-[0.8rem] text-[#888]">{j.company_name} • {j.location}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                </aside>
            </div>

            {/* Apply Modal */}
            {
                showApplyModal && (
                    <ApplyModal job={job} onClose={() => setShowApplyModal(false)} />
                )
            }
        </div >
    );
};

const ApplyModal = ({ job, onClose }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please upload your resume');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);


        setUploading(true);
        setError('');

        // Simulate progress bar (since fetch doesn't support upload progress easily without XHR/Axios)
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/apply/${job.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            clearInterval(progressInterval);

            if (res.ok) {
                setProgress(100);
                setTimeout(() => {
                    setSuccess(true);
                    setTimeout(() => {
                        onClose();
                        // Ideally trigger a refresh of job details to update "applied" status
                        window.location.reload();
                    }, 2000);
                }, 500);
            } else {
                const data = await res.json();
                setError(data.message || 'Apply failed');
                setUploading(false);
            }
        } catch (err) {
            clearInterval(progressInterval);
            setError('Network error');
            setUploading(false);
            console.error(err);
        }
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.8)] backdrop-blur-xs flex justify-center items-center z-1000">
            <div className="bg-[#1a1a1a] p-10 rounded-xl w-full max-w-125 relative border border-[#333]">
                <button onClick={onClose} className="absolute top-4 right-4 bg-none border-none text-white cursor-pointer">
                    <X size={24} />
                </button>

                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle size={60} className="text-text-accent mb-4 mx-auto" />
                        <h2>Application Sent!</h2>
                        <p>Good luck!</p>
                    </div>
                ) : (
                    <>
                        <h2 className="mb-2">Apply for {job.title}</h2>
                        <p className="text-[#888] mb-8">Upload your resume (PDF/DOCX)</p>

                        <form onSubmit={handleSubmit}>
                            {/* Visual Inputs as required by task, though inferred from token */}
                            <div className="mb-4">
                                <label className="block mb-2 text-sm text-[#888]">Full Name</label>
                                <input
                                    className="w-full bg-[#333] border border-border-light rounded p-3 text-white cursor-not-allowed opacity-70"
                                    value={user ? `${user.first_name || ''} ${user.last_name || ''}` : ''}
                                    readOnly
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm text-[#888]">Email Address</label>
                                <input
                                    className="w-full bg-[#333] border border-border-light rounded p-3 text-white cursor-not-allowed opacity-70"
                                    value={user?.email || ''}
                                    readOnly
                                />
                            </div>

                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className={`
                                    border-2 border-dashed border-[#444] p-12 rounded-lg text-center mb-4 cursor-pointer
                                    ${file ? 'bg-[rgba(204,255,0,0.05)]' : 'bg-transparent'}
                                `}
                                onClick={() => document.getElementById('resume-upload').click()}
                            >
                                <input
                                    type="file"
                                    id="resume-upload"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx"
                                />
                                <UploadCloud size={40} className={`mb-4 mx-auto ${file ? 'text-text-accent' : 'text-[#666]'}`} />
                                {file ? (
                                    <p className="text-white font-bold">{file.name}</p>
                                ) : (
                                    <p>Drag resume here or click to browse</p>
                                )}
                            </div>

                            {uploading && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs mb-1 text-[#aaa]">
                                        <span>Uploading...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-[#333] rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-text-accent h-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-red-500 mb-4">{error}</p>}

                            <button type="submit" className="btn btn-primary w-full" disabled={uploading}>
                                {uploading ? 'Processing...' : 'Submit Application'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default JobDetail;
