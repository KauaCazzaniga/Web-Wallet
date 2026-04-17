import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Mail, Lock, User, Loader2, Moon, SunMedium } from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Container, AuthBox, IconHeader, Title, Subtitle,
  Form, InputGroup, IconWrapper, Input, Button,
  ErrorMessage, Footer, ThemeButton, BackLink,
} from '@/components/ui/AuthForm/index.js';

export default function Register() {
  const { register } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await register(name, email, password);
      if (success) {
        navigate('/login');
      } else {
        setError('Erro ao cadastrar. Tente outro e-mail.');
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
        <Title>Criar Conta</Title>
        <Subtitle $dark={isDark}>Junte-se ao Web-Wallet</Subtitle>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <IconWrapper><User size={20} /></IconWrapper>
            <Input $dark={isDark} type="text" placeholder="Nome completo"
              value={name} onChange={e => setName(e.target.value)}
              disabled={isLoading} required />
          </InputGroup>
          <InputGroup>
            <IconWrapper><Mail size={20} /></IconWrapper>
            <Input $dark={isDark} type="email" placeholder="E-mail"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={isLoading} required />
          </InputGroup>
          <InputGroup>
            <IconWrapper><Lock size={20} /></IconWrapper>
            <Input $dark={isDark} type="password" placeholder="Senha"
              value={password} onChange={e => setPassword(e.target.value)}
              disabled={isLoading} required />
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 size={20} className="animate-spin" />Cadastrando...</> : 'Criar Conta'}
          </Button>
        </Form>
        <Footer $dark={isDark}>
          Já tem uma conta?
          <Link to="/login">Entre aqui</Link>
        </Footer>
      </AuthBox>
    </Container>
  );
}
