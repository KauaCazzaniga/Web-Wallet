import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// DICA: Verifique se os nomes abaixo batem 100% com os nomes dos arquivos na sua pasta 'pages'
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // Se o arquivo for 'dashboard.jsx', mude para 'dashboard'

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
