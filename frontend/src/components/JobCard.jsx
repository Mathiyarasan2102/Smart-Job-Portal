import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, Briefcase, Bookmark } from 'lucide-react';

const JobCard = ({ job, isSaved, onToggleSave }) => {
    return (
        <div className="hover-lift bg-bg-card border border-border-light rounded-lg p-6 relative transition-all duration-200 group">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onToggleSave(job.id);
                }}
                className="absolute top-6 right-6 bg-transparent border-none cursor-pointer z-2"
            >
                <Bookmark
                    size={24}
                    fill={isSaved ? 'var(--text-accent)' : 'none'}
                    color={isSaved ? 'var(--text-accent)' : '#666'}
                />
            </button>

            <Link to={`/jobs/${job.id}`} className="block">
                <div className="pr-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="mb-2 text-xl">{job.title}</h3>
                                {job.has_applied && (
                                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full mb-2">
                                        Already Applied
                                    </span>
                                )}
                            </div>
                            <p className="text-text-muted mb-4">{job.company_name}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-6">
                        {job.skills && job.skills.map((skill, i) => (
                            <span key={i} className="text-xs bg-white/5 py-[0.2rem] px-2 rounded text-[#ccc] border border-white/5">
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-6 text-[#888] text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            {job.location}
                        </div>
                        {job.salary_min && (
                            <div className="flex items-center gap-2">
                                <IndianRupee size={16} />
                                ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Briefcase size={16} />
                            {job.experience_level}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default JobCard;
