const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth'); // O "segurança" da rota

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// Limita o envio de códigos por e-mail (reset de senha e reenvio de verificação) — anti-spam por IP
const emailCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas solicitacoes de codigo. Tente novamente em 15 minutos.' },
});

// Rota para Cadastro: POST /api/auth/register
router.post('/register', authController.register);

// Rota para Login: POST /api/auth/login (limitada a 10 tentativas / 15 min por IP)
router.post('/login', loginLimiter, authController.login);

// Rota de Verificação (Escalabilidade): GET /api/auth/me
// O authMiddleware valida o token antes de deixar o controller responder
router.get('/me', authMiddleware, authController.me);

// Rota para verificar e-mail com código: POST /api/auth/verify-email  { email, code }
router.post('/verify-email', authController.verifyEmail);

// Rota para reenviar o código de verificação: POST /api/auth/resend-verification (limitada a 5 / 15 min por IP)
router.post('/resend-verification', emailCodeLimiter, authController.resendVerification);

// Rota para solicitar código de redefinição: POST /api/auth/forgot-password (limitada a 5 / 15 min por IP)
router.post('/forgot-password', emailCodeLimiter, authController.forgotPassword);

// Rota para redefinir a senha com código: POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;