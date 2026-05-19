// Hook: useScrollReveal
// Responsabilidade: Detecta quando um elemento entra no viewport e aciona fade + slide-up
// Usa callback ref para funcionar mesmo quando o elemento é montado após o render inicial (ex: após loading)
import { useCallback, useRef, useState } from 'react';

export function useScrollReveal() {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback((el) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) return;

    if (!window.IntersectionObserver) {
      setVisible(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observerRef.current?.disconnect();
          observerRef.current = null;
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    observerRef.current.observe(el);
  }, []);

  return [ref, visible];
}
