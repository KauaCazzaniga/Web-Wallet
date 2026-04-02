import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { authenticated, loading } = useContext(AuthContext);

    // Enquanto o App verifica o LocalStorage, mostramos um "Carregando"
    if (loading) {
        return (
            <div style={{
                display: 'flex', height: '100vh', justifyContent: 'center',
                alignItems: 'center', background: '#0f172a', color: 'white'
            }}>
                Cargando autenticação...
            </div>
        );
    }

    // Se não estiver autenticado, redireciona para o login
    if (!authenticated) {
        return <Navigate to="/login" />;
    }

    // Se estiver tudo ok, renderiza a página protegida
    return children;
};