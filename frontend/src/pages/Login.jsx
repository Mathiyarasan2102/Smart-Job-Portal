import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(formData.email, formData.password);
        if (res.success) {
            if (res.role === 'recruiter') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen animate-enter">
            <div className="w-full max-w-100 p-8 bg-bg-card rounded-lg border border-border-light">
                <h1 className="mb-6 text-center">Welcome Back</h1>

                {error && <div className="bg-[#300] text-[#f88] p-2 rounded mb-4 text-[0.9rem]">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2">Email</label>
                        <input
                            type="email"
                            className="bg-transparent border border-border-light rounded p-2 text-white w-full"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Password</label>
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
                        Login
                    </button>

                    <p className="text-center mt-4 text-[#888] text-[0.9rem]">
                        Don't have an account? <Link to="/register" className="text-text-accent">Sign up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
