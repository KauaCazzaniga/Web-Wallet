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

// Rota para Cadastro: POST /api/auth/register
router.post('/register', authController.register);

// Rota para Login: POST /api/auth/login (limitada a 10 tentativas / 15 min por IP)
router.post('/login', loginLimiter, authController.login);

// Rota de Verificação (Escalabilidade): GET /api/auth/me
// O authMiddleware valida o token antes de deixar o controller responder
router.get('/me', authMiddleware, authController.me);

// Rota para solicitar link de redefinição: POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// Rota para redefinir a senha com token: POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;