// Testes: authController — forgotPassword e resetPassword
// Abordagem: monkey-patch via vi.spyOn nos objetos reais (evita ESM/CJS interop issue)
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Importar os módulos reais — todos usam o mesmo cache CJS
import User from '../models/User';
import sgMail from '@sendgrid/mail';
import { forgotPassword, resetPassword } from './authController.js';

// Spy nos objetos reais antes dos testes
beforeAll(() => {
  vi.spyOn(User, 'findOne');
  vi.spyOn(sgMail, 'setApiKey').mockReturnValue(undefined);
  vi.spyOn(sgMail, 'send').mockResolvedValue(true);
});

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};
const mockReq = (body = {}) => ({ body });

// --- forgotPassword ---
describe('forgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 genérico quando e-mail não existe (anti-enumeration)', async () => {
    User.findOne.mockResolvedValue(null);
    const res = mockRes();

    await forgotPassword(mockReq({ email: 'naoexiste@test.com' }), res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('link') })
    );
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  it('salva hash no user e envia e-mail quando e-mail existe', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = { email: 'user@test.com', name: 'Usuário', save: saveMock };
    User.findOne.mockResolvedValue(fakeUser);
    process.env.SENDGRID_API_KEY = 'FAKE_KEY_FOR_TESTS';
    process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    const res = mockRes();
    await forgotPassword(mockReq({ email: 'user@test.com' }), res);

    expect(fakeUser.resetPasswordToken).toBeTruthy();
    expect(fakeUser.resetPasswordExpires).toBeInstanceOf(Date);
    expect(saveMock).toHaveBeenCalled();
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it('retorna 500 se sgMail.send lançar erro', async () => {
    const fakeUser = { email: 'user@test.com', name: 'Usuário', save: vi.fn().mockResolvedValue(true) };
    User.findOne.mockResolvedValue(fakeUser);
    sgMail.send.mockRejectedValueOnce(new Error('SendGrid down'));

    const res = mockRes();
    await forgotPassword(mockReq({ email: 'user@test.com' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// --- resetPassword ---
describe('resetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 se token ou newPassword ausentes', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ token: '', newPassword: '' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 400 se token não encontrar user (inválido ou expirado)', async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    const res = mockRes();

    await resetPassword(mockReq({ token: 'tokeninvalido', newPassword: 'testpass123' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('inválido') })
    );
  });

  it('atualiza senha e limpa token quando válido', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = {
      password: 'old-hash-value',
      resetPasswordToken: 'hash',
      resetPasswordExpires: new Date(Date.now() + 999999),
      save: saveMock,
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });

    const res = mockRes();
    await resetPassword(mockReq({ token: 'rawtoken', newPassword: 'testpass123' }), res);

    expect(fakeUser.password).toBe('testpass123');
    expect(fakeUser.resetPasswordToken).toBeUndefined();
    expect(fakeUser.resetPasswordExpires).toBeUndefined();
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('sucesso') })
    );
  });

  it('token já usado (null após primeiro reset) → 400', async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    const res = mockRes();

    await resetPassword(mockReq({ token: 'tokenusado', newPassword: 'testpass123' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
