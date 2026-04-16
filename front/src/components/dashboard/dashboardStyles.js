// Styled-components compartilhados entre os sub-componentes do Dashboard
// Todos dependem das CSS variables --dash-* declaradas no AppContainer de Dashboard.jsx

import styled, { keyframes } from 'styled-components';

export const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const ModalOverlay = styled.div`
  position: fixed; inset: 0; background-color: rgba(15,23,42,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
export const ModalContent = styled.div`
  background: var(--dash-surface); padding: 2rem; border-radius: 1rem;
  width: 100%; max-width: ${p => p.$sm ? '380px' : '450px'};
  max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--dash-border);
  box-shadow: var(--dash-shadow); animation: ${fadeIn} 0.2s ease;
`;
export const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
  h3 { font-size: 1.125rem; font-weight: 600; color: var(--dash-heading); }
  button { background: none; border: none; cursor: pointer; color: var(--dash-muted); padding: 0.25rem; border-radius: 0.25rem;
    &:hover { color: var(--dash-heading); } }
`;
export const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.875rem;
  label { font-size: 0.75rem; font-weight: 600; color: var(--dash-muted-strong); text-transform: uppercase; letter-spacing: 0.03em; }
  input, select {
    padding: 0.7rem 0.875rem; border: 1px solid var(--dash-border); border-radius: 0.5rem;
    font-size: 0.875rem; outline: none; background: var(--dash-input-bg); transition: all 0.15s;
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); appearance: none;
    &:focus { border-color: var(--dash-primary); background: var(--dash-surface); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  select option { color: var(--dash-heading); background: var(--dash-surface); }
`;
export const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;
  button {
    padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 500;
    cursor: pointer; border: none; font-size: 0.875rem; transition: all 0.15s;
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }
  .cancel { background: var(--dash-surface-muted); color: var(--dash-text); &:hover { filter: brightness(1.04); } }
  .save   { background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%); color: #fff; &:hover { filter: brightness(1.05); } }
  .danger { background: #ef4444; color: #fff; &:hover { background: #dc2626; } }
`;
export const Panel = styled.div`
  background: var(--dash-surface); padding: 1.5rem; border-radius: 0.875rem;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-soft-shadow);
`;
export const PanelHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem; width: 100%;
  h3 { font-size: 1rem; font-weight: 600; color: var(--dash-heading); }
`;
export const GoalItem = styled.div`
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 0.85rem 1rem; background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  border-radius: 0.75rem; margin-bottom: 0.65rem; box-shadow: var(--dash-soft-shadow);
  .goal-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; justify-content: space-between; width: 100%; }
  span { font-size: 0.95rem; white-space: nowrap; color: var(--dash-heading); }
  input {
    width: 7rem; padding: 0.6rem 0.8rem; border: 1px solid var(--dash-border-strong);
    border-radius: 0.625rem; font-size: 0.875rem; outline: none; background: var(--dash-input-bg);
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); flex-shrink: 0;
    &:focus { border-color: var(--dash-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  button { color: #ef4444; border: none; background: none; cursor: pointer; padding: 0.35rem; border-radius: 0.375rem; flex-shrink: 0; &:hover { background: #fef2f2; } }
`;
