import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.$dark ? '#0f172a' : '#eef5ff'};
  background-image: ${p => p.$dark
    ? 'radial-gradient(circle at 50% -20%, #1e293b, #0f172a)'
    : 'radial-gradient(circle at 50% -20%, #dbeafe, #eef5ff)'};
  font-family: 'Inter', sans-serif;
  padding: 1rem;
  position: relative;
`;

export const AuthBox = styled.div`
  background: ${p => p.$dark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.88)'};
  backdrop-filter: blur(12px);
  padding: 3.5rem 3rem;
  border-radius: 1.5rem;
  box-shadow: ${p => p.$dark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(37, 99, 235, 0.18)'};
  border: 1px solid ${p => p.$dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.18)'};
  text-align: center;
  width: 100%;
  max-width: 420px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #a855f7, #3b82f6, transparent);
  }
`;

export const IconHeader = styled.div`
  display: inline-flex;
  padding: 1rem;
  border-radius: 1rem;
  background: ${p => p.$dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.08)'};
  margin-bottom: 1rem;
`;

export const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.05em;
`;

export const Subtitle = styled.p`
  color: ${p => p.$dark ? '#94a3b8' : '#64748b'};
  font-weight: 500;
  margin-bottom: 2.5rem;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 2rem;
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const IconWrapper = styled.div`
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

export const Input = styled.input`
  width: 100%;
  padding: 1.1rem 1rem 1.1rem 3.25rem;
  background-color: ${p => p.$dark ? '#0f172a' : '#f8fbff'};
  border: 2px solid ${p => p.$dark ? '#1e293b' : '#d8e3f3'};
  border-radius: 0.75rem;
  color: ${p => p.$dark ? '#f8fafc' : '#0f172a'};
  font-size: 1.05rem;
  font-weight: 600;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #a855f7;
    background-color: ${p => p.$dark ? '#1e293b' : '#ffffff'};
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
  }
`;

export const Button = styled.button`
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

export const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 4px solid #ef4444;
`;

export const Footer = styled.div`
  margin-top: 2rem;
  font-size: 0.95rem;
  color: ${p => p.$dark ? '#94a3b8' : '#64748b'};

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 700;
    margin-left: 0.5rem;
    &:hover { text-decoration: underline; }
  }
`;

export const ThemeButton = styled.button`
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

export const BackLink = styled(Link)`
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
