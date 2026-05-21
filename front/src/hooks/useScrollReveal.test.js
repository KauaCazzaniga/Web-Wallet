import { renderHook, act } from '@testing-library/react';
import { useScrollReveal } from './useScrollReveal';

describe('useScrollReveal', () => {
  let observeMock;
  let disconnectMock;
  let capturedCallback;

  beforeEach(() => {
    observeMock    = vi.fn();
    disconnectMock = vi.fn();

    // IntersectionObserver é chamado com `new`, precisa ser uma classe
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb) {
        capturedCallback = cb;
        this.observe    = observeMock;
        this.disconnect = disconnectMock;
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna [ref, false] no estado inicial', () => {
    const { result } = renderHook(() => useScrollReveal());
    const [ref, visible] = result.current;
    expect(visible).toBe(false);
    expect(typeof ref).toBe('function');
  });

  it('observa o elemento quando o ref é anexado', () => {
    const { result } = renderHook(() => useScrollReveal());
    const el = document.createElement('div');
    act(() => result.current[0](el));
    expect(observeMock).toHaveBeenCalledWith(el);
  });

  it('torna-se visível quando o elemento intersecta', () => {
    const { result } = renderHook(() => useScrollReveal());
    const el = document.createElement('div');
    act(() => result.current[0](el));

    act(() => capturedCallback([{ isIntersecting: true }]));

    expect(result.current[1]).toBe(true);
  });

  it('não se torna visível quando isIntersecting é false', () => {
    const { result } = renderHook(() => useScrollReveal());
    const el = document.createElement('div');
    act(() => result.current[0](el));

    act(() => capturedCallback([{ isIntersecting: false }]));

    expect(result.current[1]).toBe(false);
  });

  it('desconecta o observer após a primeira intersecção (one-shot)', () => {
    const { result } = renderHook(() => useScrollReveal());
    const el = document.createElement('div');
    act(() => result.current[0](el));

    act(() => capturedCallback([{ isIntersecting: true }]));

    expect(disconnectMock).toHaveBeenCalled();
  });

  it('desconecta o observer anterior quando um novo elemento é passado', () => {
    const { result } = renderHook(() => useScrollReveal());
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');

    act(() => result.current[0](el1));
    act(() => result.current[0](el2));

    expect(disconnectMock).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledTimes(2);
  });

  it('cai para visible=true quando IntersectionObserver não está disponível', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { result } = renderHook(() => useScrollReveal());
    const el = document.createElement('div');

    act(() => result.current[0](el));

    expect(result.current[1]).toBe(true);
  });
});
