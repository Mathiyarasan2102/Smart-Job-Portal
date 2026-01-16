import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import JobCard from '../components/JobCard';
import MultiSelect from '../components/MultiSelect'; // Import MultiSelect
import { useAuth } from '../context/AuthContext';
import { Filter, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';

import toast from 'react-hot-toast';

// Constants for Dropdowns
const EXP_OPTIONS = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'lead', label: 'Lead / Manager' }
];

const LOC_OPTIONS = [
    { value: 'Bangalore', label: 'Bangalore' },
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Hyderabad', label: 'Hyderabad' },
    { value: 'Remote', label: 'Remote' },
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Pune', label: 'Pune' }
];

const SKILL_OPTIONS = [
    { value: 'React', label: 'React' },
    { value: 'Node.js', label: 'Node.js' },
    { value: 'Python', label: 'Python' },
    { value: 'Java', label: 'Java' },
    { value: 'SQL', label: 'SQL' },
    { value: 'AWS', label: 'AWS' },
    { value: 'Docker', label: 'Docker' },
    { value: 'Figma', label: 'Figma' }
];

const JobList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    // State
    const [jobs, setJobs] = useState([]);
    const [savedJobIds, setSavedJobIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    // Filter State (Arrays for multi-select)
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        location: [],
        experience: [],
        skills: [],
        sort: 'created_at-desc'
    });

    // Sync changes to URL
    useEffect(() => {
        if (showSavedOnly) return;
        const params = {};
        if (page > 1) params.page = page;
        if (filters.search) params.search = filters.search;
        if (filters.sort !== 'created_at-desc') params.sort = filters.sort;
        if (filters.location.length) params.location = filters.location.join(',');
        if (filters.experience.length) params.experience = filters.experience.join(',');
        if (filters.skills.length) params.skills = filters.skills.join(',');
        setSearchParams(params);
    }, [filters, page, showSavedOnly, setSearchParams]);

    // Fetch Jobs (Debounced)
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                let url;
                if (showSavedOnly) {
                    if (user) {
                        url = `${import.meta.env.VITE_API_URL}/api/saved-jobs`;
                    } else {
                        const localSaved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
                        if (localSaved.length === 0) {
                            setJobs([]);
                            setTotal(0);
                            setLoading(false);
                            return;
                        }
                        const query = new URLSearchParams({
                            ids: localSaved.join(','),
                            limit: 100
                        }).toString();
                        url = `${import.meta.env.VITE_API_URL}/api/jobs?${query}`;
                    }
                } else {
                    const params = new URLSearchParams();
                    params.append('page', page);
                    params.append('limit', 10);
                    if (filters.search) params.append('search', filters.search);
                    if (filters.sort) params.append('sort', filters.sort);
                    if (filters.location.length) params.append('location', filters.location.join(','));
                    if (filters.experience.length) params.append('experience', filters.experience.join(','));
                    if (filters.skills.length) params.append('skills', filters.skills.join(','));

                    url = `${import.meta.env.VITE_API_URL}/api/jobs?${params.toString()}`;
                }

                const res = await fetch(url, {
                    headers: user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}
                });
                const data = await res.json();

                if (data.status === 'success') {
                    setJobs(data.data.jobs);
                    setTotal(showSavedOnly ? data.data.jobs.length : data.total);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchJobs();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters, page, showSavedOnly, user]);

    // Fetch Saved Status
    useEffect(() => {
        const fetchSavedStatus = async () => {
            if (!user) {
                const localSaved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
                setSavedJobIds(new Set(localSaved));
                return;
            }
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/saved-jobs`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setSavedJobIds(new Set(data.data.jobs.map(j => j.id)));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSavedStatus();
    }, [user]);

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const handleToggleSave = async (jobId) => {
        if (!user) {
            const currentSaved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
            let newSaved;
            if (currentSaved.includes(jobId)) {
                newSaved = currentSaved.filter(id => id !== jobId);
                toast.success("Job removed from saved");
            } else {
                newSaved = [...currentSaved, jobId];
                toast.success("Job saved locally");
            }
            localStorage.setItem('savedJobs', JSON.stringify(newSaved));
            setSavedJobIds(new Set(newSaved));
            return;
        }

        const newSet = new Set(savedJobIds);
        if (newSet.has(jobId)) {
            newSet.delete(jobId);
        } else {
            newSet.add(jobId);
        }
        setSavedJobIds(newSet);

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/saved-jobs/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ jobId })
            });
            toast.success(newSet.has(jobId) ? "Job saved" : "Job removed");
        } catch (err) {
            console.error("Failed to save", err);
            // Revert optimistic update
            setSavedJobIds(prev => {
                const reverted = new Set(prev);
                if (newSet.has(jobId)) reverted.delete(jobId);
                else reverted.add(jobId);
                return reverted;
            });
            toast.error("Failed to save job");
        }
    };

    const totalPages = Math.ceil(total / 10);

    return (
        <div className="container animate-enter grid grid-cols-[250px_1fr] gap-12">

            {/* Sidebar Filters */}
            <aside className="sticky top-25 h-fit">
                <div className="flex items-center gap-2 mb-6">
                    <Filter size={20} className="text-text-accent" />
                    <h3>Filters</h3>
                </div>

                <button
                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                    className={`w-full p-3 rounded cursor-pointer mb-6 flex items-center justify-center gap-2 font-bold border border-border-light transition-colors ${showSavedOnly ? 'bg-text-accent text-black' : 'bg-transparent text-white'
                        }`}
                >
                    <Bookmark size={16} /> {showSavedOnly ? 'Show All Jobs' : 'Saved Jobs'}
                </button>

                <div className={`flex flex-col gap-6 ${showSavedOnly ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div>
                        <label className="block mb-2 text-sm text-[#888]">Keywords</label>
                        <input
                            name="search"
                            className="w-full bg-transparent border border-border-light rounded px-3 py-2 text-white h-10.5"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="e.g. Frontend"
                        />
                    </div>

                    <MultiSelect
                        label="Location"
                        options={LOC_OPTIONS}
                        selected={filters.location}
                        onChange={(val) => handleFilterChange('location', val)}
                        placeholder="Select Locations..."
                    />

                    <MultiSelect
                        label="Experience"
                        options={EXP_OPTIONS}
                        selected={filters.experience}
                        onChange={(val) => handleFilterChange('experience', val)}
                        placeholder="Select Experience..."
                    />

                    <MultiSelect
                        label="Skills"
                        options={SKILL_OPTIONS}
                        selected={filters.skills}
                        onChange={(val) => handleFilterChange('skills', val)}
                        placeholder="Select Skills..."
                    />

                    <div>
                        <label className="block mb-2 text-sm text-[#888]">Sort By</label>
                        <select
                            name="sort"
                            value={filters.sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            className="w-full h-10.5 bg-bg-card border border-border-light rounded px-2 text-white"
                        >
                            <option value="created_at-desc">Newest First</option>
                            <option value="salary_max-desc">Highest Salary</option>
                        </select>
                    </div>
                </div>
            </aside>

            {/* Job List */}
            <main>
                <div className="mb-8">
                    <h2 className="text-[2rem]">
                        {showSavedOnly ? 'Saved Jobs' : `Open Positions (${total})`}
                    </h2>
                </div>

                {loading ? (
                    <div>Loading jobs...</div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {jobs.map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    isSaved={savedJobIds.has(job.id)}
                                    onToggleSave={handleToggleSave}
                                />
                            ))}
                            {jobs.length === 0 && <p>No jobs found.</p>}
                        </div>

                        {/* Pagination - Hide if showing saved only (simplified) */}
                        {!showSavedOnly && totalPages > 1 && (
                            <div className="flex justify-center gap-4 mt-12">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className={`btn btn-outline ${page === 1 ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <span className="flex items-center">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className={`btn btn-outline ${page === totalPages ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default JobList;
