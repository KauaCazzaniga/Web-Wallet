import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom'; // Adicionado Link
import { Wallet, Mail, Lock, Loader2 } from 'lucide-react'; // Adicionado Loader2

import { AuthContext } from '../contexts/AuthContext';

// --- ESTILOS ---
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a; 
  background-image: radial-gradient(circle at 50% -20%, #1e293b, #0f172a);
  font-family: 'Inter', sans-serif;
  padding: 1rem;
`;

const LoginBox = styled.div`
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  padding: 3.5rem 3rem;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  width: 100%;
  max-width: 420px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #a855f7, #3b82f6, transparent);
  }
`;

const IconHeader = styled.div`
  display: inline-flex;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(59, 130, 246, 0.1);
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.05em;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 2.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 1.25rem;
  color: #64748b;
  display: flex;
  align-items: center;
  transition: color 0.3s;

  ${InputGroup}:focus-within & {
    color: #a855f7;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1.1rem 1rem 1.1rem 3.25rem;
  background-color: #0f172a;
  border: 2px solid #1e293b;
  border-radius: 0.75rem;
  color: #f8fafc;
  font-size: 1.05rem;
  font-weight: 600;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #a855f7;
    background-color: #1e293b;
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1.1rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.1);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 4px solid #ef4444;
`;

const Footer = styled.div`
  margin-top: 2rem;
  font-size: 0.95rem;
  color: #94a3b8;

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 700;
    margin-left: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// --- COMPONENTE ---
export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Novo estado de loading

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
    } catch (err) {
      setError('Ocorreu um erro no servidor. Tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <LoginBox>
        <IconHeader>
          <Wallet size={40} color="#a855f7" />
        </IconHeader>
        <Title>Web-Wallet</Title>
        <Subtitle>Seja bem-vindo de volta!</Subtitle>

        <Form onSubmit={handleLogin}>
          <InputGroup>
            <IconWrapper><Mail size={20} /></IconWrapper>
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </InputGroup>

          <InputGroup>
            <IconWrapper><Lock size={20} /></IconWrapper>
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </Button>
        </Form>

        <Footer>
          Não tem uma conta?
          <Link to="/register">Cadastre-se agora</Link>
        </Footer>
      </LoginBox>
    </Container>
  );
}