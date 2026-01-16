import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Download, Check, Clock } from 'lucide-react';

// Simple Chart Components
const BarChart = ({ data, maxVal }) => (
    <div className="flex items-end gap-4 h-50 border-b border-border-light pb-2">
        {data.map((d, i) => {
            const height = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
            return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <span className="text-lg text-white font-bold transition-transform duration-300 group-hover:-translate-y-1">{d.value}</span>
                    <div
                        className="w-full max-w-10 bg-text-accent rounded-t transition-all duration-300 group-hover:brightness-110 group-hover:shadow-[0_0_15px_rgba(204,255,0,0.3)] group-hover:scale-y-105 origin-bottom"
                        style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-[#888] truncate w-full text-center">{d.label}</span>
                </div>
            );
        })}
    </div>
);

// Double Bar Chart for Comparison
const DoubleBarChart = ({ data, maxVal }) => (
    <div className="flex items-end gap-4 h-64 border-b border-border-light pb-2 overflow-x-auto">
        {data.map((d, i) => {
            const h1 = maxVal > 0 ? (d.v1 / maxVal) * 100 : 0;
            const h2 = maxVal > 0 ? (d.v2 / maxVal) * 100 : 0;
            return (
                <div key={i} className="min-w-10 flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="flex gap-1 items-end h-full w-full justify-center">
                        {/* Bar 1: Jobs */}
                        <div className="w-3 bg-blue-500 rounded-t relative group-hover:opacity-80 transition-all" style={{ height: `${h1}%` }}>
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 font-bold">{d.v1 > 0 ? d.v1 : ''}</span>
                        </div>
                        {/* Bar 2: Apps */}
                        <div className="w-3 bg-[#ccff00] rounded-t relative group-hover:opacity-80 transition-all" style={{ height: `${h2}%` }}>
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[#ccff00] font-bold">{d.v2 > 0 ? d.v2 : ''}</span>
                        </div>
                    </div>
                    <span className="text-[10px] text-[#888] truncate w-full text-center">{d.label}</span>
                </div>
            );
        })}
    </div>
);

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
                            maxVal={Math.max(...jobs.map(j => j.application_count || 0), 10)}
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
                        maxVal={Math.max(...Object.values(stats.statusDist), 10)}
                    />
                </div>
            </div>

            {/* Posted Jobs List */}
            <h2 className="mb-6">Posted Jobs</h2>
            <div className="grid grid-asymmetric gap-6">
                {jobs.map(job => (
                    <div key={job.id} className="bg-bg-card p-6 rounded-lg border border-border-light flex justify-between items-center hover-lift">
                        <div>
                            <h3 className="mb-1 text-lg">{job.title}</h3>
                            <p className="text-[#888] text-sm">{job.location} • {new Date(job.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-bold">{job.application_count || 0}</div>
                                <div className="text-xs text-[#666]">Applicants</div>
                            </div>
                            <Link to={`/applications/${job.id}`} className="btn btn-primary btn-sm">
                                View
                            </Link>
                        </div>
                    </div>
                ))}
                {jobs.length === 0 && <p>No jobs posted yet.</p>}
            </div>
        </div>
    );
};

export default RecruiterDashboard;

