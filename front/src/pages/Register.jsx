import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, User } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

// Reutilizando a base visual do Login para manter a identidade da Fintech
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a; 
  background-image: radial-gradient(circle at 50% -20%, #1e293b, #0f172a);
  font-family: 'Inter', sans-serif;
`;

const RegisterBox = styled.div`
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  padding: 3.5rem 3rem;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05);
  border: 1px solid rgba(148, 163, 184, 0.1);
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
  background-color: #0f172a;
  border: 2px solid #1e293b;
  border-radius: 0.75rem;
  color: #f8fafc;
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
  color: #94a3b8;
  margin-top: 2rem;
  font-size: 0.9rem;
  a { color: #3b82f6; text-decoration: none; font-weight: 600; }
`;

export default function Register() {
    const { register } = useContext(AuthContext);
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
        <Container>
            <RegisterBox>
                <Title>Criar Conta</Title>
                <Form onSubmit={handleSubmit}>
                    <InputGroup>
                        <IconWrapper><User size={20} /></IconWrapper>
                        <Input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required />
                    </InputGroup>
                    <InputGroup>
                        <IconWrapper><Mail size={20} /></IconWrapper>
                        <Input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
                    </InputGroup>
                    <InputGroup>
                        <IconWrapper><Lock size={20} /></IconWrapper>
                        <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
                    </InputGroup>
                    <Button type="submit">Cadastrar</Button>
                </Form>
                <FooterText>Já tem uma conta? <Link to="/login">Entre aqui</Link></FooterText>
            </RegisterBox>
        </Container>
    );
}