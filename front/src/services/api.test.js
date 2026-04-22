import { describe, expect, it, vi, afterEach } from 'vitest';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('normalizeApiBaseUrl', () => {
    it('usa a origem atual quando a variavel nao existe', async () => {
        vi.stubGlobal('window', {
            location: { origin: 'https://www.waltrix.com.br' },
        });

        const { normalizeApiBaseUrl } = await import('./api');

        expect(normalizeApiBaseUrl()).toBe('https://www.waltrix.com.br/api');
    });

    it('mantem uma URL de API valida', async () => {
        const { normalizeApiBaseUrl } = await import('./api');

        expect(normalizeApiBaseUrl('https://api-waltrix.vercel.app/api')).toBe(
            'https://api-waltrix.vercel.app/api'
        );
    });

    it('corrige URLs acidentalmente montadas com uma rota de tela antes de /api', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { normalizeApiBaseUrl } = await import('./api');

        expect(normalizeApiBaseUrl('https://www.waltrix.com.br/login/api')).toBe(
            'https://www.waltrix.com.br/api'
        );
        expect(warnSpy).toHaveBeenCalledOnce();
    });
});
