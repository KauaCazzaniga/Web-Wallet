// Testes: emailTemplates — invariantes de apresentação e segurança de cliente de e-mail.
// Regra de negócio testada: o código sempre aparece (legível), o destinatário é nomeado, o
// prazo correto é exibido por tipo de e-mail, e o HTML é seguro para clientes (sem SVG inline
// nem <style>, com logo hospedado configurável).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verificationEmail, passwordResetEmail } from './emailTemplates.js';

describe('emailTemplates — código de verificação', () => {
    it('exibe o código de 6 dígitos formatado em dois grupos (legibilidade)', () => {
        const html = verificationEmail({ name: 'Ana', code: '284913' });
        expect(html).toContain('284 913');
    });

    it('nomeia o destinatário no corpo do e-mail', () => {
        expect(verificationEmail({ name: 'Carlos', code: '111222' })).toContain('Carlos');
        expect(passwordResetEmail({ name: 'Beatriz', code: '111222' })).toContain('Beatriz');
    });

    it('inclui o código no texto de pré-visualização (preheader)', () => {
        const html = verificationEmail({ name: 'Ana', code: '777888' });
        expect(html).toContain('777 888'.replace(' ', '')); // o preheader usa o código cru
        expect(html).toContain('777888');
    });
});

describe('emailTemplates — prazo por tipo de e-mail', () => {
    it('verificação de conta expira em 24 horas', () => {
        const html = verificationEmail({ name: 'Ana', code: '284913' });
        expect(html).toContain('24 horas');
        expect(html).not.toContain('15 minutos');
    });

    it('redefinição de senha expira em 15 minutos', () => {
        const html = passwordResetEmail({ name: 'Ana', code: '284913' });
        expect(html).toContain('15 minutos');
        expect(html).not.toContain('24 horas');
    });
});

describe('emailTemplates — segurança/compatibilidade de cliente de e-mail', () => {
    it('não usa SVG inline nem blocos <style> (removidos por Gmail e afins)', () => {
        const html = verificationEmail({ name: 'Ana', code: '284913' });
        expect(html).not.toMatch(/<svg/i);
        expect(html).not.toMatch(/<style/i);
    });

    it('referencia o raio da marca como imagem hospedada (logo PNG)', () => {
        const html = verificationEmail({ name: 'Ana', code: '284913' });
        expect(html).toMatch(/<img[^>]+email-logo\.png/i);
    });
});

describe('emailTemplates — logo configurável por EMAIL_LOGO_URL', () => {
    const ORIG = process.env.EMAIL_LOGO_URL;
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => {
        if (ORIG === undefined) delete process.env.EMAIL_LOGO_URL;
        else process.env.EMAIL_LOGO_URL = ORIG;
    });

    it('usa a URL definida em EMAIL_LOGO_URL quando presente', async () => {
        process.env.EMAIL_LOGO_URL = 'https://cdn.exemplo.com/raio.png';
        const mod = await import('./emailTemplates.js');
        const html = mod.verificationEmail({ name: 'Ana', code: '284913' });
        expect(html).toContain('https://cdn.exemplo.com/raio.png');
    });
});
