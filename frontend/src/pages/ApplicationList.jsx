import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FolderOpen, CheckCircle, XCircle, Clock } from 'lucide-react';

import toast from 'react-hot-toast';

const ApplicationList = () => {
    const { jobId } = useParams();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(null);

    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [jobTitle, setJobTitle] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        sort: 'applied_at-desc'
    });

    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    page,
                    limit: 10,
                    ...filters
                }).toString();

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/job/${jobId}?${query}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setApplications(data.data.applications);
                    setTotalPages(data.totalPages);
                    setTotal(data.total);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchJob = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setJobTitle(data.data.job.title);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchJob();
        fetchApps();
    }, [jobId, page, filters]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1); // Reset to first page
    };

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${appId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setApplications(apps => apps.map(app =>
                    app.id === appId ? { ...app, status: newStatus } : app
                ));
                toast.success('Status updated');
            }
        } catch (err) {
            toast.error('Failed to update');
            console.error(err);
        }
    };

    const exportCSV = () => {
        const headers = ["Candidate Name", "Email", "Job Title", "Status", "Applied At"];
        const rows = applications.map(app => [
            `"${app.first_name} ${app.last_name}"`,
            app.email,
            `"${jobTitle}"`,
            app.status,
            app.applied_at
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `applications_job_${jobId}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const handleDownload = async (e, url) => {
        e.preventDefault();
        try {
            const fileUrl = `${import.meta.env.VITE_API_URL}/${url}`;
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = url.split('/').pop() || 'resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            window.open(`${import.meta.env.VITE_API_URL}/${url}`, '_blank');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'text-yellow-500',
            reviewed: 'text-blue-500',
            shortlisted: 'text-[#ccff00]',
            rejected: 'text-red-500',
            hired: 'text-green-500'
        };
        return (
            <span className={`${colors[status] || 'text-[#ccc]'} font-semibold capitalize flex items-center gap-[0.4rem]`}>
                {status === 'shortlisted' && <CheckCircle size={14} />}
                {status === 'rejected' && <XCircle size={14} />}
                {status === 'pending' && <Clock size={14} />}
                {status}
            </span>
        );
    };

    return (
        <div className="container animate-enter max-w-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1>Applications for {jobTitle || 'Job'}</h1>
                    <p className="text-[#888] text-sm">Total Applications: {total}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    {/* Filters */}
                    <div className="custom-select-wrapper">
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="h-10 bg-bg-card border border-border-light rounded px-3 text-white text-sm focus:border-text-accent outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                        </select>
                    </div>

                    <div className="custom-select-wrapper">
                        <select
                            name="sort"
                            value={filters.sort}
                            onChange={handleFilterChange}
                            className="h-10 bg-bg-card border border-border-light rounded px-3 text-white text-sm focus:border-text-accent outline-none"
                        >
                            <option value="applied_at-desc">Newest First</option>
                            <option value="applied_at-asc">Oldest First</option>
                            <option value="first_name-asc">Name (A-Z)</option>
                            <option value="status-asc">Status</option>
                        </select>
                    </div>

                    <button onClick={exportCSV} className="btn btn-outline h-10 px-4 text-sm">
                        <Download size={16} className="mr-2" /> Export CSV/Excel
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-bg-card rounded-lg border border-border-light mb-6">
                <table className="w-full border-collapse min-w-200">
                    <thead>
                        <tr className="border-b border-border-light text-left bg-[#222]">
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Name</th>
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Email</th>
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Job Title</th>
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Applied At</th>
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Resume</th>
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Status</th>
                            <th className="p-4 text-[#aaa] font-medium text-sm uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="p-12 text-center">Loading...</td></tr>
                        ) : (
                            applications.map(app => (
                                <tr key={app.id} className="border-b border-[#222] hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">{app.first_name} {app.last_name}</td>
                                    <td className="p-4 text-[#999]">{app.email}</td>
                                    <td className="p-4 text-[#999]">{jobTitle}</td>
                                    <td className="p-4 text-[#999]">{new Date(app.applied_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setShowPreview(app.resume_url)}
                                            className="flex items-center gap-2 text-text-accent hover:underline bg-transparent border-none cursor-pointer text-sm"
                                        >
                                            <FolderOpen size={16} /> Preview
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(app.status)}
                                    </td>
                                    <td className="p-4">
                                        <div className="custom-select-wrapper inline-block">
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                                className="p-[0.3rem] text-[0.8rem] bg-[#111] border border-[#444] rounded text-white focus:border-text-accent outline-none cursor-pointer"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="reviewed">Reviewed</option>
                                                <option value="shortlisted">Shortlisted</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="hired">Hired</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}

                        {!loading && applications.length === 0 && (
                            <tr>
                                <td colSpan="7" className="p-12 text-center text-[#888]">
                                    No applications match your filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-end items-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn btn-outline h-9 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-[#888]">
                        Page <span className="text-white font-bold">{page}</span> of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn btn-outline h-9 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Resume Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/90 z-2000 flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="w-full max-w-5xl h-[85vh] translate-y-72 flex flex-col bg-[#1e1e1e] rounded-xl border border-[#333] shadow-2xl overflow-hidden animate-enter">
                        <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#1a1a1a]">
                            <h2 className="text-lg font-medium m-0 text-white flex items-center gap-2">
                                <FolderOpen size={18} className="text-text-accent" /> Resume Preview
                            </h2>
                            <div className="flex items-center gap-4">
                                <a
                                    href={`${import.meta.env.VITE_API_URL}/${showPreview}`}
                                    onClick={(e) => handleDownload(e, showPreview)}
                                    className="flex items-center gap-2 text-sm text-[#ccc] hover:text-white transition-colors"
                                >
                                    <Download size={18} /> Download
                                </a>
                                <button
                                    onClick={() => setShowPreview(null)}
                                    className="text-[#888] hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-[#525659] relative flex items-center justify-center p-8">
                            <iframe
                                src={`${import.meta.env.VITE_API_URL}/${showPreview}`}
                                className="w-full max-w-4xl h-full bg-white shadow-2xl rounded"
                                title="Resume"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationList;
