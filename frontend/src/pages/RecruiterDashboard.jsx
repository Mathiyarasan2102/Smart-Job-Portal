import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Download, Check, Clock, Trash2 } from 'lucide-react';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// Simple Chart Component using Recharts
const formatYAxis = (tickItem) => {
    if (tickItem >= 1000) {
        return (tickItem / 1000).toString() + 'k';
    }
    return tickItem;
};

const BarChart = ({ data, color = "#ccff00" }) => {
    if (!data || data.length === 0) return <p className="text-[#666]">No data available</p>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12 }}
                        tickFormatter={formatYAxis}
                    />
                    <RechartsTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={color || '#ccff00'} />
                        ))}
                    </Bar>
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Double Bar Chart for Comparison using Recharts
const DoubleBarChart = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-[#666]">No activity yet</p>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12 }}
                        tickFormatter={formatYAxis}
                    />
                    <RechartsTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="v1" name="Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="v2" name="Applications" fill="#ccff00" radius={[4, 4, 0, 0]} barSize={20} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-bg-card p-6 rounded-lg border border-border-light flex items-center gap-4">
        <div className="p-4 bg-white/5 rounded-full text-text-accent">
            <Icon size={24} />
        </div>
        <div>
            <h3 className="text-2xl m-0">{value}</h3>
            <p className="text-[#888] text-sm m-0">{title}</p>
        </div>
    </div>
);

const RecruiterDashboard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalApplications: 0,
        statusDist: { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, hired: 0 },
        trend: []
    });

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                setJobs(prev => prev.filter(j => j.id !== jobId));
                setStats(prev => ({ ...prev, totalJobs: prev.totalJobs - 1 }));
            } else {
                console.error("Failed to delete job");
            }
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Jobs (Basic info + app count)
                // We'll limit to 50 for now. Ideal: paginated or dedicated stats endpoint.
                const jobRes = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs?limit=50`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const jobData = await jobRes.json();

                if (jobData.status === 'success') {
                    // Filter for current recruiter (using loose equality for safety)
                    const myJobs = jobData.data.jobs.filter(j => j.recruiter_id == user.id);
                    setJobs(myJobs);

                    // 2. Fetch all applications for these jobs to build status distribution
                    let totalApps = 0;
                    const dist = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, hired: 0 };

                    for (const job of myJobs) {
                        if (job.application_count > 0) {
                            const appRes = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/job/${job.id}`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            const appData = await appRes.json();
                            if (appData.status === 'success') {
                                totalApps += appData.data.applications.length;
                                appData.data.applications.forEach(app => {
                                    if (dist[app.status] !== undefined) dist[app.status]++;
                                });
                            }
                        }
                    }

                    // 3. Fetch Trend Stats
                    let trendData = [];
                    try {
                        const trendRes = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/stats`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        const trendJson = await trendRes.json();
                        if (trendJson.status === 'success') {
                            trendData = trendJson.data.trend;
                        }
                    } catch (e) { console.error(e); }

                    setStats({
                        totalJobs: myJobs.length,
                        totalApplications: totalApps,
                        statusDist: dist,
                        trend: trendData
                    });
                }

            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [user]);

    return (
        <div className="container animate-enter max-w-300 mx-auto">
            <h1 className="mb-8">Recruiter Dashboard</h1>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard title="Active Jobs" value={stats.totalJobs} icon={Clock} />
                <StatCard title="Total Applications" value={stats.totalApplications} icon={Download} />
                <StatCard title="Shortlisted Candidates" value={stats.statusDist.shortlisted} icon={Check} />
            </div>

            {/* Jobs vs Applications Trend */}
            <div className="bg-bg-card p-8 rounded-lg border border-border-light mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="m-0">Jobs Posted vs Applications (Last 30 Days)</h3>
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded"></div> Jobs</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ccff00] rounded"></div> Applications</div>
                    </div>
                </div>

                {stats.trend.length > 0 ? (
                    <DoubleBarChart
                        data={stats.trend.map(t => ({
                            label: new Date(t.date + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }),
                            v1: t.jobs,
                            v2: t.apps
                        }))}
                        maxVal={Math.max(...stats.trend.map(t => Math.max(t.jobs, t.apps)), 5)}
                    />
                ) : (
                    <p className="text-[#666]">No activity yet.</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Apps per Job Chart */}
                <div className="bg-bg-card p-8 rounded-lg border border-border-light">
                    <h3 className="mb-6">Applications per Job</h3>
                    {stats.totalJobs > 0 ? (
                        <BarChart
                            data={jobs.map(j => ({ label: j.title.substring(0, 10) + '...', value: j.application_count || 0 }))}
                            maxVal={Math.max(...jobs.map(j => j.application_count || 0), 5)}
                        />
                    ) : (
                        <p className="text-[#666]">No jobs data</p>
                    )}
                </div>

                {/* Status Distribution Chart */}
                <div className="bg-bg-card p-8 rounded-lg border border-border-light">
                    <h3 className="mb-6">Application Status</h3>
                    <BarChart
                        data={Object.entries(stats.statusDist).map(([key, val]) => ({ label: key, value: val }))}
                        maxVal={Math.max(...Object.values(stats.statusDist), 5)}
                    />
                </div>
            </div>

            {/* Posted Jobs List */}
            <h2 className="mb-6">Posted Jobs</h2>
            <div className="grid grid-asymmetric gap-6">
                {jobs.map(job => (
                    <div key={job.id} className="bg-bg-card p-6 rounded-lg border border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift">
                        <div className="flex-1">
                            <h3 className="mb-1 text-lg leading-tight">{job.title}</h3>
                            <p className="text-[#888] text-sm mt-1">{job.location} • {new Date(job.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-6 self-end sm:self-auto">
                            <div className="text-right flex flex-col justify-center h-full">
                                <div className="text-2xl font-bold leading-none">{job.application_count || 0}</div>
                                <div className="text-xs text-[#666] mt-1">Applicants</div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <Link to={`/applications/${job.id}`} className="btn btn-primary btn-sm h-9 flex items-center">
                                    View
                                </Link>
                                <button
                                    onClick={() => handleDeleteJob(job.id)}
                                    className="btn btn-outline btn-icon h-9 w-9 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500 transition-colors"
                                    title="Delete Job"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {jobs.length === 0 && <p>No jobs posted yet.</p>}
            </div>
        </div>
    );
};

export default RecruiterDashboard;

