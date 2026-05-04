// Hook: useToast
// Responsabilidade: gerenciar estado e lógica do toast de notificação
// Depende de: React (useState, useCallback)

import { useState, useCallback } from 'react';

const TOAST_DURATION_MS = 3500;

/**
 * Hook reutilizável de toast.
 * @returns {{ toast: {show, message, type}, notify: function }}
 */
export function useToast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const notify = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), TOAST_DURATION_MS);
  }, []);

  return { toast, notify };
}
