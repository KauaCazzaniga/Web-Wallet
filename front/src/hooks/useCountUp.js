// Hook: useCountUp
// Responsabilidade: Anima um valor numérico de seu estado anterior até o novo valor alvo
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target, duration = 400) {
  const [value, setValue]    = useState(target);
  const prevRef              = useRef(target);
  const currentRef           = useRef(target); // rastreia o valor intermediário exibido
  const rafRef               = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to   = target;
    if (from === to) return;

    const start = performance.now();
    const animate = (now) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * ease;
      currentRef.current = next;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(to);
        prevRef.current    = to;
        currentRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Parte do valor intermediário exibido, não do valor inicial da animação
      prevRef.current = currentRef.current;
    };
  }, [target, duration]);

  return value;
}
