import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FinanceProvider } from './context/FinanceContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// DICA: Verifique se os nomes abaixo batem 100% com os nomes dos arquivos na sua pasta 'pages'
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
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
                        <ErrorBoundary>
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            {/* Rota legada de link por token aposentada — fluxo agora é por código em /forgot-password */}
                            <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />

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
                        </ErrorBoundary>
                    </FinanceGate>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
