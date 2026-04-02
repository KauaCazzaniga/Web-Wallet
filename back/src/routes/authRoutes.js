const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth'); // O "segurança" da rota

// Rota para Cadastro: POST /api/auth/register
router.post('/register', authController.register);

// Rota para Login: POST /api/auth/login
router.post('/login', authController.login);

// Rota de Verificação (Escalabilidade): GET /api/auth/me
// O authMiddleware valida o token antes de deixar o controller responder
router.get('/me', authMiddleware, authController.me);

module.exports = router;