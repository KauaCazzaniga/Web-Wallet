import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Mail, Lock, Loader2, Moon, SunMedium } from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Container, AuthBox, IconHeader, Title, Subtitle,
  Form, InputGroup, IconWrapper, Input, Button,
  ErrorMessage, Footer, ThemeButton, BackLink,
} from '../components/ui/AuthForm/index.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const successMessage = location.state?.message || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const isSuccess = await login(email, password);
      if (isSuccess) {
        navigate('/dashboard');
      } else {
        setError('E-mail ou senha incorretos. Verifique seus dados.');
      }
    } catch {
      setError('Ocorreu um erro no servidor. Tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container $dark={isDark}>
      <BackLink to="/" $dark={isDark}>
        <ArrowLeft size={16} />
        Landing
      </BackLink>
      <ThemeButton type="button" onClick={toggleTheme} $dark={isDark}>
        {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
      </ThemeButton>
      <AuthBox $dark={isDark}>
        <IconHeader $dark={isDark}>
          <Wallet size={40} color="#a855f7" />
        </IconHeader>
        <Title>Web-Wallet</Title>
        <Subtitle $dark={isDark}>Seja bem-vindo de volta!</Subtitle>
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <IconWrapper><Mail size={20} /></IconWrapper>
            <Input $dark={isDark} type="email" placeholder="Seu e-mail"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={isLoading} required />
          </InputGroup>
          <InputGroup>
            <IconWrapper><Lock size={20} /></IconWrapper>
            <Input $dark={isDark} type="password" placeholder="Sua senha"
              value={password} onChange={e => setPassword(e.target.value)}
              disabled={isLoading} required />
          </InputGroup>
          {successMessage && (
            <ErrorMessage style={{ color: '#22c55e', borderLeftColor: '#22c55e', background: 'rgba(34,197,94,0.1)' }}>
              {successMessage}
            </ErrorMessage>
          )}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 size={20} className="animate-spin" />Autenticando...</> : 'Entrar no Sistema'}
          </Button>
        </Form>
        <Footer $dark={isDark}>
          <Link to="/forgot-password" style={{ display: 'block', marginBottom: '0.5rem' }}>Esqueceu sua senha?</Link>
          Não tem uma conta?
          <Link to="/register">Cadastre-se agora</Link>
        </Footer>
      </AuthBox>
    </Container>
  );
}
