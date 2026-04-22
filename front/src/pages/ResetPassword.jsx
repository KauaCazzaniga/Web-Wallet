// Componente: ResetPassword
// Responsabilidade: formulário de redefinição de senha com token da URL
// Depende de: AuthContext (resetPassword), ThemeContext, AuthForm styled-components
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Lock, Loader2, Moon, SunMedium } from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Container, AuthBox, IconHeader, Title, Subtitle,
  Form, InputGroup, IconWrapper, Input, Button,
  ErrorMessage, Footer, ThemeButton, BackLink,
} from '@/components/ui/AuthForm/index.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      navigate('/login', { replace: true, state: { message: 'Senha redefinida com sucesso! Faça login.' } });
    } catch (err) {
      const msg = err?.response?.data?.error;
      setError(msg || 'Token inválido ou expirado. Solicite um novo link.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <Container $dark={isDark}>
      <BackLink to="/login" $dark={isDark}>
        <ArrowLeft size={16} />
        Login
      </BackLink>
      <ThemeButton type="button" onClick={toggleTheme} $dark={isDark}>
        {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
      </ThemeButton>
      <AuthBox $dark={isDark}>
        <IconHeader $dark={isDark}>
          <Wallet size={40} color="#a855f7" />
        </IconHeader>
        <Title>Waltrix</Title>
        <Subtitle $dark={isDark}>Crie uma nova senha</Subtitle>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <IconWrapper><Lock size={20} /></IconWrapper>
            <Input
              $dark={isDark}
              type="password"
              placeholder="Nova senha (mín. 6 caracteres)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </InputGroup>
          <InputGroup>
            <IconWrapper><Lock size={20} /></IconWrapper>
            <Input
              $dark={isDark}
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? <><Loader2 size={20} className="animate-spin" />Redefinindo...</>
              : 'Redefinir senha'}
          </Button>
        </Form>
        <Footer $dark={isDark}>
          Lembrou a senha?
          <a href="/login">Voltar ao login</a>
        </Footer>
      </AuthBox>
    </Container>
  );
}
