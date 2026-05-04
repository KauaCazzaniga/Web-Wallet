import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FinanceProvider } from './context/FinanceContext';

// DICA: Verifique se os nomes abaixo batem 100% com os nomes dos arquivos na sua pasta 'pages'
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard'; // Se o arquivo for 'dashboard.jsx', mude para 'dashboard'
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Investimentos from './pages/Investimentos';

function FinanceGate({ children }) {
    const { user } = useContext(AuthContext);
    const financeKey = user?._id || user?.email || 'anon';

    return (
        <FinanceProvider userKey={financeKey}>
            {children}
        </FinanceProvider>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <FinanceGate>
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/investimentos"
                                element={
                                    <ProtectedRoute>
                                        <Investimentos />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/relatorios"
                                element={
                                    <ProtectedRoute>
                                        <Relatorios />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/configuracoes"
                                element={
                                    <ProtectedRoute>
                                        <Configuracoes />
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </FinanceGate>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
