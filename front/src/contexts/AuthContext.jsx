import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- 1. DEFINA AS FUNÇÕES PRIMEIRO ---

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email: email.trim(),
                password,
            });
            const { token, user: userData } = response.data;

            localStorage.setItem('@WebWallet:token', token);
            localStorage.setItem('@WebWallet:user', JSON.stringify(userData));

            api.defaults.headers.Authorization = `Bearer ${token}`;
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error("Erro no login:", error);
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao realizar login.',
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await api.post('/auth/register', { name, email, password });
            // 201 (conta criada) ou 200 (já existia e não verificada → código reenviado)
            return { success: true, ...response.data };
        } catch (error) {
            console.error("Erro no registro:", error);
            return { success: false, error: error.response?.data?.error };
        }
    };

    const verifyEmail = async (email, code) => {
        const response = await api.post('/auth/verify-email', { email, code });
        return response.data;
    };

    const resendVerification = async (email) => {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    };

    const forgotPassword = async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    };

    const resetPassword = async (email, code, newPassword) => {
        const response = await api.post('/auth/reset-password', { email, code, newPassword });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('@WebWallet:token');
        localStorage.removeItem('@WebWallet:user');
        api.defaults.headers.Authorization = null;
        setUser(null);
    };

    // --- 2. DEPOIS O USEEFFECT ---
    useEffect(() => {
        const storageUser = localStorage.getItem('@WebWallet:user');
        const storageToken = localStorage.getItem('@WebWallet:token');

        if (storageUser && storageToken) {
            api.defaults.headers.Authorization = `Bearer ${storageToken}`;
            setUser(JSON.parse(storageUser));
        }
        setLoading(false);
    }, []);

    // --- 3. POR ÚLTIMO O RETURN ---
    return (
        <AuthContext.Provider value={{
            authenticated: !!user,
            user,
            loading,
            login,
            register,
            logout,
            forgotPassword,
            resetPassword,
            verifyEmail,
            resendVerification,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
