import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User, LogOut, PlusCircle } from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="fixed top-0 w-full z-100 bg-bg-app/80 backdrop-blur-md border-b border-white/5 px-8 py-4">
                <div className="container flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold font-heading text-text-main flex items-center gap-2">
                        <Briefcase className="text-text-accent" size={24} />
                        SmartJobs
                    </Link>

                    <div className="flex gap-8 items-center">
                        <Link to="/jobs" className="font-medium text-[0.95rem] hover-lift">Browse Jobs</Link>

                        {user ? (
                            <>
                                {user.role === 'recruiter' && (
                                    <>
                                        <Link to="/post-job" className="btn btn-outline text-text-accent">
                                            <PlusCircle size={16} className="mr-2" /> Post Job
                                        </Link>
                                        <Link to="/dashboard" className="ml-4 font-medium">Dashboard</Link>
                                    </>
                                )}
                                {user.role === 'candidate' && (
                                    <Link to="/my-applications" className="ml-4 font-medium">My Applications</Link>
                                )}
                                <div className="flex gap-4 items-center border-l border-[#333] pl-4">
                                    <span className="text-sm text-[#999]">{user.first_name}</span>
                                    <button onClick={handleLogout} className="btn-outline px-[0.8rem] py-[0.4rem] text-[0.8rem]">
                                        <LogOut size={14} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link to="/login" className="btn btn-primary">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="flex-1 pt-24 px-8 pb-8 w-full max-w-350 mx-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
