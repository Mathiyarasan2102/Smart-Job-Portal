import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (token && savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        return null;
    });
    // Loading is no longer needed with lazy initialization


    const login = async (email, password) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                setUser(data.data.user);
                return { success: true, role: data.data.user.role };
            } else {
                return { success: false, message: data.message };
            }
        } catch (err) {
            console.error(err);
            return { success: false, message: 'Network error' };
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                setUser(data.data.user);
                return { success: true, role: data.data.user.role };
            } else {
                return { success: false, message: data.message };
            }
        } catch (err) {
            console.error(err);
            return { success: false, message: 'Network error' };
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
