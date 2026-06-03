// Testes: authController — register, verifyEmail/resendVerification e forgot/resetPassword (fluxo por código)
// Abordagem: monkey-patch via vi.spyOn nos objetos reais (evita ESM/CJS interop issue)
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import crypto from 'crypto';

// Importar os módulos reais — User é deduplicado via mongoose.models, então o spy no
// import propaga para o require do controller. emailService NÃO é deduplicado: por isso
// usamos a ponte CJS (authController.testdeps.js) para obter a MESMA instância do controller.
import User from '../models/User';
import emailService from './authController.testdeps.js';
import { register, forgotPassword, resetPassword, verifyEmail, resendVerification } from './authController.js';

// Curto-circuita connectDB: o database.js retorna cedo se já houver conexão em cache
// (global.mongoose.conn), evitando qualquer mongoose.connect real durante os testes.
// vi.mock não intercepta require() CJS neste setup, então mutamos o cache compartilhado.
if (!global.mongoose) global.mongoose = { conn: null, promise: null };
global.mongoose.conn = global.mongoose.conn || {};

// Spy nos objetos reais antes dos testes (mesmo objeto module.exports do controller)
beforeAll(() => {
  vi.spyOn(User, 'findOne');
  vi.spyOn(User, 'create');
  vi.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(undefined);
  vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(undefined);
});

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};
const mockReq = (body = {}) => ({ body });

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

// --- forgotPassword ---
describe('forgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 genérico quando e-mail não existe (anti-enumeration)', async () => {
    User.findOne.mockResolvedValue(null);
    const res = mockRes();

    await forgotPassword(mockReq({ email: 'naoexiste@test.com' }), res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('codigo') })
    );
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('salva hash do código, zera tentativas e envia e-mail quando e-mail existe', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = { email: 'user@test.com', name: 'Usuário', save: saveMock };
    User.findOne.mockResolvedValue(fakeUser);

    const res = mockRes();
    await forgotPassword(mockReq({ email: 'user@test.com' }), res);

    expect(fakeUser.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    expect(fakeUser.resetPasswordExpires).toBeInstanceOf(Date);
    expect(fakeUser.resetPasswordAttempts).toBe(0);
    expect(saveMock).toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com', code: expect.stringMatching(/^\d{6}$/) })
    );
  });

  it('retorna 500 se o envio de e-mail lançar erro', async () => {
    const fakeUser = { email: 'user@test.com', name: 'Usuário', save: vi.fn().mockResolvedValue(true) };
    User.findOne.mockResolvedValue(fakeUser);
    emailService.sendPasswordResetEmail.mockRejectedValueOnce(new Error('Resend down'));

    const res = mockRes();
    await forgotPassword(mockReq({ email: 'user@test.com' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// --- resetPassword ---
describe('resetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 se email, code ou newPassword ausentes', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ email: '', code: '', newPassword: '' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 400 quando o usuário não tem código pendente', async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    const res = mockRes();

    await resetPassword(mockReq({ email: 'user@test.com', code: '123456', newPassword: 'testpass123' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('invalido') })
    );
  });

  it('retorna 400 e limpa o código quando expirado', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = {
      resetPasswordToken: sha256('123456'),
      resetPasswordExpires: new Date(Date.now() - 1000), // já expirou
      resetPasswordAttempts: 0,
      save: saveMock,
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await resetPassword(mockReq({ email: 'user@test.com', code: '123456', newPassword: 'testpass123' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fakeUser.resetPasswordToken).toBeUndefined();
    expect(saveMock).toHaveBeenCalled();
  });

  it('incrementa tentativas e retorna 400 quando o código está errado', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = {
      resetPasswordToken: sha256('123456'),
      resetPasswordExpires: new Date(Date.now() + 999999),
      resetPasswordAttempts: 0,
      save: saveMock,
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await resetPassword(mockReq({ email: 'user@test.com', code: '000000', newPassword: 'testpass123' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fakeUser.resetPasswordAttempts).toBe(1);
    expect(saveMock).toHaveBeenCalled();
  });

  it('retorna 429 quando excede o limite de tentativas', async () => {
    const fakeUser = {
      resetPasswordToken: sha256('123456'),
      resetPasswordExpires: new Date(Date.now() + 999999),
      resetPasswordAttempts: 5,
      save: vi.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await resetPassword(mockReq({ email: 'user@test.com', code: '123456', newPassword: 'testpass123' }), res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('atualiza a senha e limpa o código quando válido', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = {
      password: 'old-hash-value',
      resetPasswordToken: sha256('123456'),
      resetPasswordExpires: new Date(Date.now() + 999999),
      resetPasswordAttempts: 0,
      save: saveMock,
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });

    const res = mockRes();
    await resetPassword(mockReq({ email: 'user@test.com', code: '123456', newPassword: 'testpass123' }), res);

    expect(fakeUser.password).toBe('testpass123');
    expect(fakeUser.resetPasswordToken).toBeUndefined();
    expect(fakeUser.resetPasswordExpires).toBeUndefined();
    expect(fakeUser.resetPasswordAttempts).toBeUndefined();
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('sucesso') })
    );
  });
});

// --- register (envio do código de verificação) ---
describe('register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cria o usuário com hash do código e envia o código de 6 dígitos por e-mail', async () => {
    User.findOne.mockResolvedValue(null); // e-mail ainda não cadastrado
    const criado = { email: 'novo@test.com', name: 'Novo', password: 'hash' };
    User.create.mockResolvedValue(criado);

    const res = mockRes();
    await register(mockReq({ name: 'Novo', email: 'novo@test.com', password: 'segredo123' }), res);

    // O documento criado guarda o HASH do código (nunca o código em texto puro) e zera tentativas
    const payloadCriacao = User.create.mock.calls[0][0];
    expect(payloadCriacao.emailVerified).toBe(false);
    expect(payloadCriacao.emailVerificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(payloadCriacao.emailVerificationAttempts).toBe(0);

    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'novo@test.com', code: expect.stringMatching(/^\d{6}$/) })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejeita recadastro de e-mail já verificado (400, sem código)', async () => {
    User.findOne.mockResolvedValue({ email: 'existe@test.com', emailVerified: true });
    const res = mockRes();

    await register(mockReq({ name: 'X', email: 'existe@test.com', password: 'segredo123' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.create).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('conta existente não verificada → reenvia código e responde needsVerification', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const existente = { email: 'pendente@test.com', name: 'Pendente', emailVerified: false, save: saveMock };
    User.findOne.mockResolvedValue(existente);
    const res = mockRes();

    await register(mockReq({ name: 'Pendente', email: 'pendente@test.com', password: 'segredo123' }), res);

    expect(User.create).not.toHaveBeenCalled();
    expect(existente.emailVerificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(existente.emailVerificationAttempts).toBe(0);
    expect(saveMock).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'pendente@test.com', code: expect.stringMatching(/^\d{6}$/) })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ needsVerification: true, email: 'pendente@test.com' })
    );
  });
});

// --- verifyEmail (código) ---
describe('verifyEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 se email ou code ausentes', async () => {
    const res = mockRes();
    await verifyEmail(mockReq({ email: '', code: '' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('é idempotente: e-mail já verificado responde sucesso sem erro', async () => {
    const fakeUser = { emailVerified: true };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await verifyEmail(mockReq({ email: 'user@test.com', code: '123456' }), res);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('verificado') })
    );
  });

  it('incrementa tentativas e retorna 400 quando o código está errado', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = {
      emailVerified: false,
      emailVerificationToken: sha256('123456'),
      emailVerificationExpires: new Date(Date.now() + 999999),
      emailVerificationAttempts: 0,
      save: saveMock,
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await verifyEmail(mockReq({ email: 'user@test.com', code: '000000' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fakeUser.emailVerificationAttempts).toBe(1);
  });

  it('retorna 429 quando excede o limite de tentativas', async () => {
    const fakeUser = {
      emailVerified: false,
      emailVerificationToken: sha256('123456'),
      emailVerificationExpires: new Date(Date.now() + 999999),
      emailVerificationAttempts: 5,
      save: vi.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await verifyEmail(mockReq({ email: 'user@test.com', code: '123456' }), res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('ativa a conta e limpa o código quando válido', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = {
      emailVerified: false,
      emailVerificationToken: sha256('123456'),
      emailVerificationExpires: new Date(Date.now() + 999999),
      emailVerificationAttempts: 0,
      save: saveMock,
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });
    const res = mockRes();

    await verifyEmail(mockReq({ email: 'user@test.com', code: '123456' }), res);

    expect(fakeUser.emailVerified).toBe(true);
    expect(fakeUser.emailVerificationToken).toBeUndefined();
    expect(fakeUser.emailVerificationAttempts).toBeUndefined();
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('sucesso') })
    );
  });
});

// --- resendVerification ---
describe('resendVerification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responde genérico e não envia e-mail quando a conta não existe', async () => {
    User.findOne.mockResolvedValue(null);
    const res = mockRes();

    await resendVerification(mockReq({ email: 'naoexiste@test.com' }), res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('responde genérico e não reenvia quando o e-mail já está verificado', async () => {
    User.findOne.mockResolvedValue({ emailVerified: true });
    const res = mockRes();

    await resendVerification(mockReq({ email: 'user@test.com' }), res);

    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('gera novo código e reenvia quando a conta existe e não está verificada', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const fakeUser = { email: 'user@test.com', name: 'Usuário', emailVerified: false, save: saveMock };
    User.findOne.mockResolvedValue(fakeUser);
    const res = mockRes();

    await resendVerification(mockReq({ email: 'user@test.com' }), res);

    expect(fakeUser.emailVerificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(fakeUser.emailVerificationAttempts).toBe(0);
    expect(saveMock).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com', code: expect.stringMatching(/^\d{6}$/) })
    );
  });
});
