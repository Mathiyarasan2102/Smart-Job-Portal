import { useState, useEffect } from 'react';
import { Briefcase, Building, MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateApplications = () => {

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/my-applications`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setApplications(data.data.applications);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'shortlisted': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'hired': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        }
    };

    if (loading) return <div className="container pt-24 text-center">Loading applications...</div>;

    return (
        <div className="container animate-enter max-w-250">
            <h1 className="mb-8 flex items-center gap-3">
                <Briefcase className="text-text-accent" /> My Applications
            </h1>

            {applications.length === 0 ? (
                <div className="text-center p-12 bg-bg-card border border-border-light rounded-xl">
                    <p className="text-lg text-[#888] mb-6">You haven't applied to any jobs yet.</p>
                    <Link to="/jobs" className="btn btn-primary">Find Jobs</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {applications.map(app => (
                        <div key={app.id} className="bg-bg-card p-6 rounded-xl border border-border-light flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-text-accent/50 transition-colors">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">{app.title}</h3>
                                <div className="flex flex-wrap gap-4 text-sm text-[#999]">
                                    <span className="flex items-center gap-1"><Building size={14} /> {app.company_name}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {app.location}</span>
                                    <span className="flex items-center gap-1"><Calendar size={14} /> Applied on {new Date(app.applied_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}</span>
                                </div>
                            </div>

                            <div className={`px-4 py-2 rounded-full border text-sm font-medium capitalize flex items-center gap-2 ${getStatusColor(app.status)}`}>
                                {app.status === 'shortlisted' ? <CheckCircle size={16} /> :
                                    app.status === 'rejected' ? <XCircle size={16} /> :
                                        <Clock size={16} />}
                                {app.status}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CandidateApplications;
