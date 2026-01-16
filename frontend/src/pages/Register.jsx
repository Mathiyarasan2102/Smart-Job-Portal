import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'candidate'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await register(formData);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen animate-enter">
            <div className="w-full max-w-125 p-10 bg-bg-card rounded-lg border border-border-light mt-">
                <h1 className="mb-2 text-center">Create Account</h1>
                <p className="text-center text-[#888] mb-8">Join the community of top talent</p>

                {error && <div className="bg-[#300] text-[#f88] p-2 rounded mb-4 text-[0.9rem]">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div
                            onClick={() => setFormData({ ...formData, role: 'candidate' })}
                            className={`
                                cursor-pointer p-4 rounded-md text-center transition-all duration-200
                                border
                                ${formData.role === 'candidate'
                                    ? 'border-text-accent bg-[rgba(204,255,0,0.05)]'
                                    : 'border-border-light bg-transparent'}
                            `}
                        >
                            <User size={24} color={formData.role === 'candidate' ? 'var(--text-accent)' : '#666'} className="mb-2 mx-auto" />
                            <div className="font-semibold text-[0.9rem]">Candidate</div>
                        </div>

                        <div
                            onClick={() => setFormData({ ...formData, role: 'recruiter' })}
                            className={`
                                cursor-pointer p-4 rounded-md text-center transition-all duration-200
                                border
                                ${formData.role === 'recruiter'
                                    ? 'border-text-accent bg-[rgba(204,255,0,0.05)]'
                                    : 'border-border-light bg-transparent'}
                            `}
                        >
                            <Briefcase size={24} color={formData.role === 'recruiter' ? 'var(--text-accent)' : '#666'} className="mb-2 mx-auto" />
                            <div className="font-semibold text-[0.9rem]">Recruiter</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-[0.9rem]">First Name</label>
                            <input
                                className="bg-transparent border border-border-light rounded p-2 text-white w-full"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-[0.9rem]">Last Name</label>
                            <input
                                className="bg-transparent border border-border-light rounded p-2 text-white w-full"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-[0.9rem]">Email</label>
                        <input
                            type="email"
                            className="bg-transparent border border-border-light rounded p-2 text-white w-full"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-[0.9rem]">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="bg-transparent border border-border-light rounded p-2 text-white w-full pr-10"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#888] cursor-pointer hover:text-white"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary mt-4">
                        Create Account
                    </button>

                    <p className="text-center mt-4 text-[#888] text-[0.9rem]">
                        Already have an account? <Link to="/login" className="text-text-accent">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
