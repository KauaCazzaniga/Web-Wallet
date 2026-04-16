import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- 1. DEFINA AS FUNÇÕES PRIMEIRO ---

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('@WebWallet:token', token);
            localStorage.setItem('@WebWallet:user', JSON.stringify(userData));

            api.defaults.headers.Authorization = `Bearer ${token}`;
            setUser(userData);
            return true;
        } catch (error) {
            console.error("Erro no login:", error);
            return false;
        }
    };

    const register = async (name, email, password) => {
        try {
            await api.post('/auth/register', { name, email, password });
            return true;
        } catch (error) {
            console.error("Erro no registro:", error);
            return false;
        }
    };

    const forgotPassword = async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    };

    const resetPassword = async (token, newPassword) => {
        const response = await api.post('/auth/reset-password', { token, newPassword });
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
        }}>
            {children}
        </AuthContext.Provider>
    );
};