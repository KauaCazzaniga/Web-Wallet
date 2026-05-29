import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.$dark ? '#000000' : '#f0fdf6'};
  background-image: ${p => p.$dark
    ? 'radial-gradient(circle at 50% -20%, #03080f, #000000)'
    : 'radial-gradient(circle at 50% -20%, #d1fae5, #f0fdf6)'};
  font-family: 'Outfit', 'Nunito', sans-serif;
  padding: 1rem;
  position: relative;
`;

export const AuthBox = styled.div`
  background: ${p => p.$dark ? 'rgba(5,5,14,0.88)' : 'rgba(255,255,255,0.92)'};
  backdrop-filter: blur(12px);
  padding: 3.5rem 3rem;
  border-radius: 1.5rem;
  box-shadow: ${p => p.$dark ? '0 25px 50px -12px rgba(0,4,16,0.6)' : '0 25px 50px -12px rgba(59,130,246,0.14)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,0.12)' : 'rgba(168,212,188,0.3)'};
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
    background: linear-gradient(90deg, transparent, #bfdbfe, #60a5fa, transparent);
  }
`;

export const IconHeader = styled.div`
  display: inline-flex;
  padding: 1rem;
  border-radius: 1rem;
  background: ${p => p.$dark ? 'rgba(96,165,250,0.1)' : 'rgba(59,130,246,0.08)'};
  margin-bottom: 1rem;
`;

export const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.05em;
`;

export const Subtitle = styled.p`
  color: ${p => p.$dark ? '#5a8f72' : '#4d8a6e'};
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
  color: #2d5a42;
  display: flex;
  align-items: center;
  transition: color 0.3s;

  ${InputGroup}:focus-within & {
    color: #60a5fa;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 1.1rem 1rem 1.1rem 3.25rem;
  background-color: ${p => p.$dark ? '#03070f' : '#f4fbf8'};
  border: 2px solid ${p => p.$dark ? 'rgba(96,165,250,0.15)' : '#c8e6d8'};
  border-radius: 0.75rem;
  color: ${p => p.$dark ? '#eff6ff' : '#0d1f18'};
  font-size: 1.05rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #60a5fa;
    background-color: ${p => p.$dark ? '#04090f' : '#ffffff'};
    box-shadow: 0 0 15px rgba(96,165,250,0.12);
  }
`;

export const Button = styled.button`
  width: 100%;
  padding: 1.1rem;
  margin-top: 1rem;
  background: ${p => p.$dark
    ? 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'};
  color: ${p => p.$dark ? '#ffffff' : '#1e40af'};
  border: 1px solid ${p => p.$dark ? 'transparent' : 'rgba(147,197,253,0.6)'};
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
  box-shadow: ${p => p.$dark
    ? '0 8px 24px rgba(59,130,246,0.35)'
    : '0 4px 14px rgba(96,165,250,0.20)'};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.05);
    box-shadow: ${p => p.$dark
      ? '0 14px 32px rgba(59,130,246,0.5)'
      : '0 6px 20px rgba(96,165,250,0.30)'};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(239,68,68,0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 4px solid #ef4444;
`;

export const Footer = styled.div`
  margin-top: 2rem;
  font-size: 0.95rem;
  color: ${p => p.$dark ? '#3d6a54' : '#4d8a6e'};

  a {
    color: #60a5fa;
    text-decoration: none;
    font-weight: 700;
    margin-left: 0.5rem;
    &:hover { color: #93c5fd; text-decoration: underline; }
  }
`;

export const ThemeButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 999px;
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,0.15)' : '#c8e6d8'};
  background: ${p => p.$dark ? 'rgba(5,5,14,0.88)' : 'rgba(255,255,255,0.92)'};
  color: ${p => p.$dark ? '#eff6ff' : '#0d1f18'};
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
  color: ${p => p.$dark ? '#bfdbfe' : '#065f46'};
  background: ${p => p.$dark ? 'rgba(5,18,12,0.85)' : 'rgba(255,255,255,0.92)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,0.15)' : '#c8e6d8'};
`;
