import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  let rafQueue;
  let nowMock;

  beforeEach(() => {
    rafQueue = [];
    nowMock  = vi.spyOn(performance, 'now').mockReturnValue(0);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flush = (timestamp) => {
    const callbacks = [...rafQueue];
    rafQueue.length = 0;
    callbacks.forEach((cb) => cb(timestamp));
  };

  it('retorna o valor alvo imediatamente (sem animação)', () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current).toBe(100);
  });

  it('não dispara animação quando o alvo não muda', () => {
    const { rerender } = renderHook(({ t }) => useCountUp(t), { initialProps: { t: 50 } });
    rerender({ t: 50 });
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('anima em direção ao novo alvo ao ser atualizado', () => {
    const { result, rerender } = renderHook(({ t }) => useCountUp(t), { initialProps: { t: 0 } });

    rerender({ t: 100 });

    // t=0.5 (200ms / 400ms) → ease ≈ 0.875 → valor ≈ 87.5
    nowMock.mockReturnValue(200);
    act(() => flush(200));

    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it('chega exatamente ao alvo ao final da animação', () => {
    const { result, rerender } = renderHook(({ t }) => useCountUp(t), { initialProps: { t: 0 } });

    rerender({ t: 200 });

    nowMock.mockReturnValue(400); // 400ms = duração total
    act(() => flush(400));

    expect(result.current).toBe(200);
  });

  it('não regride para zero quando o alvo muda durante animação em curso', () => {
    // Usa mock de tempo controlável (monotônico) para evitar colisão com performance.now
    let now = 0;
    nowMock.mockImplementation(() => now);

    const { result, rerender } = renderHook(({ t }) => useCountUp(t), { initialProps: { t: 0 } });

    // Animação 1: 0 → 1000 (start capturado como now=0)
    rerender({ t: 1000 });
    now = 200; // 200ms → t=0.5, ease≈0.875 → valor≈875
    act(() => flush(200));
    expect(result.current).toBeGreaterThan(500); // confirma que a animação está em curso

    // Interrompe e inicia animação 2: 875→200 (fix) ou 0→200 (bug)
    // O start da nova animação é capturado como now=200
    rerender({ t: 200 });
    now = 201; // apenas 1ms de progresso → t≈0.0025, quase sem avanço
    act(() => flush(201));

    // Com o fix: from≈875, t≈0, valor≈875 (praticamente no start da nova animação)
    // Com o bug stale: from=0, to=200, valor≈1.5 (saltou de volta a quase zero)
    expect(result.current).toBeGreaterThan(400);
  });

  it('cancela o RAF no cleanup', () => {
    const { unmount, rerender } = renderHook(({ t }) => useCountUp(t), { initialProps: { t: 0 } });
    rerender({ t: 500 });
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
