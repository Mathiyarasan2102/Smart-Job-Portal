import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Shield, Zap } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        const term = e.target.search.value;
        navigate(`/jobs?search=${term}`);
    };

    return (
        <div className="animate-enter">
            {/* Hero Section */}
            <section className="min-h-[60vh] flex flex-col justify-center items-center text-center relative">
                <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 width-[600px] height-[600px] w-150 h-150 bg-[radial-gradient(circle,rgba(204,255,0,0.15)_0%,rgba(0,0,0,0)_70%)] -z-10"></div>

                <h1 className="text-[clamp(3rem,6vw,5rem)] leading-[1.1] mb-6 max-w-225">
                    Find work that <br />
                    <span className="text-text-accent">matters to you.</span>
                </h1>

                <p className="text-[1.2rem] text-text-muted max-w-150 mb-12">
                    The curated job board for developers, designers, and creators who want to build the future. No noise, just high-quality roles.
                </p>

                <form onSubmit={handleSearch} className="flex gap-4 bg-bg-card p-2 rounded-lg border border-border-light w-full max-w-125 shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover-lift">
                    <div className="relative flex-1">
                        <Search size={20} color="#666" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            name="search"
                            placeholder="Job title, keywords, or company..."
                            className="border-none bg-transparent pl-10 h-full w-full focus:outline-none text-white placeholder-gray-600"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Search
                    </button>
                </form>
            </section>

            {/* Features (Asymmetric Grid) */}
            <section className="py-16">
                <div className="container">
                    <div className="grid grid-cols-12 gap-8">

                        {/* Card 1 - Large */}
                        <div className="col-span-8 bg-bg-card p-12 rounded-xl border border-border-light hover-lift">
                            <TrendingUp size={40} className="text-text-accent mb-4" />
                            <h3>Curated Opportunities</h3>
                            <p className="text-text-muted mt-2">
                                We manually verify every listing to ensure salary transparency and legitimate companies. No more ghosting.
                            </p>
                        </div>

                        {/* Card 2 - Small */}
                        <div className="col-span-4 bg-[#222] p-12 rounded-xl flex flex-col justify-center hover-lift">
                            <h2 className="text-[3rem] m-0">450+</h2>
                            <p>New jobs this week</p>
                        </div>

                        {/* Card 3 - Medium */}
                        <div className="col-span-12 md:col-span-5 bg-bg-card p-12 rounded-xl border border-border-light hover-lift">
                            <Shield size={40} className="text-text-accent mb-4" />
                            <h3>Privacy First</h3>
                            <p className="text-text-muted mt-2">
                                Your profile is hidden from your current employer. Apply with confidence.
                            </p>
                        </div>

                        {/* Card 4 - Medium */}
                        <div className="col-span-12 md:col-span-7 bg-bg-card p-12 rounded-xl border border-border-light hover-lift">
                            <Zap size={40} className="text-text-accent mb-4" />
                            <h3>Instant Applications</h3>
                            <p className="text-text-muted mt-2">
                                Drag and drop your resume once. Apply to multiple jobs with a single click.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
