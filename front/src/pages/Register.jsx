import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Mail, Lock, User, Moon, SunMedium } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

// Reutilizando a base visual do Login para manter a identidade da Fintech
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.$dark ? '#0f172a' : '#eef5ff'}; 
  background-image: ${p => p.$dark
    ? 'radial-gradient(circle at 50% -20%, #1e293b, #0f172a)'
    : 'radial-gradient(circle at 50% -20%, #dbeafe, #eef5ff)'};
  font-family: 'Inter', sans-serif;
  position: relative;
`;

const RegisterBox = styled.div`
  background: ${p => p.$dark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(10px);
  padding: 3.5rem 3rem;
  border-radius: 1.5rem;
  box-shadow: ${p => p.$dark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)' : '0 25px 50px -12px rgba(37,99,235,0.18)'};
  border: 1px solid ${p => p.$dark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.18)'};
  text-align: center;
  width: 100%;
  max-width: 420px;
  position: relative;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 2rem;
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
`;

const Input = styled.input`
  width: 100%;
  padding: 1.1rem 1rem 1.1rem 3.25rem;
  background-color: ${p => p.$dark ? '#0f172a' : '#f8fbff'};
  border: 2px solid ${p => p.$dark ? '#1e293b' : '#d8e3f3'};
  border-radius: 0.75rem;
  color: ${p => p.$dark ? '#f8fafc' : '#0f172a'};
  font-size: 1.05rem;
  font-weight: 600;
  transition: all 0.3s ease;
  &:focus { outline: none; border-color: #a855f7; }
`;

const Button = styled.button`
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1rem;
`;

const FooterText = styled.p`
  color: ${p => p.$dark ? '#94a3b8' : '#64748b'};
  margin-top: 2rem;
  font-size: 0.9rem;
  a { color: #3b82f6; text-decoration: none; font-weight: 600; }
`;
const ThemeButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 999px;
  border: 1px solid ${p => p.$dark ? 'rgba(255, 255, 255, 0.08)' : '#d8e3f3'};
  background: ${p => p.$dark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255,255,255,0.92)'};
  color: ${p => p.$dark ? '#f8fafc' : '#0f172a'};
  display: grid;
  place-items: center;
  cursor: pointer;
`;
const BackLink = styled(Link)`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.72rem 0.95rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  color: ${p => p.$dark ? '#dce8ff' : '#173155'};
  background: ${p => p.$dark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255,255,255,0.92)'};
  border: 1px solid ${p => p.$dark ? 'rgba(255, 255, 255, 0.08)' : '#d8e3f3'};
`;

export default function Register() {
    const { register } = useContext(AuthContext);
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(name, email, password);
        if (success) {
            alert("Cadastro realizado! Agora faça seu login.");
            navigate('/login');
        } else {
            alert("Erro ao cadastrar. Tente outro e-mail.");
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
            <RegisterBox $dark={isDark}>
                <Title>Criar Conta</Title>
                <Form onSubmit={handleSubmit}>
                    <InputGroup>
                        <IconWrapper><User size={20} /></IconWrapper>
                        <Input $dark={isDark} type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required />
                    </InputGroup>
                    <InputGroup>
                        <IconWrapper><Mail size={20} /></IconWrapper>
                        <Input $dark={isDark} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
                    </InputGroup>
                    <InputGroup>
                        <IconWrapper><Lock size={20} /></IconWrapper>
                        <Input $dark={isDark} type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
                    </InputGroup>
                    <Button type="submit">Cadastrar</Button>
                </Form>
                <FooterText $dark={isDark}>Já tem uma conta? <Link to="/login">Entre aqui</Link></FooterText>
            </RegisterBox>
        </Container>
    );
}
