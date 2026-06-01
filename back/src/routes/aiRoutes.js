const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const aiController = require('../controllers/aiController');

// Rate limit por usuário autenticado — chave = usuarioId (setado pelo authMiddleware)
// Limita a 15 req/min por usuário para não estourar o quota global da API de IA
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.usuarioId || ipKeyGenerator(req),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { erro: 'Muitas requisições ao assistente. Aguarde um momento antes de enviar outra mensagem.' },
    skip: () => process.env.NODE_ENV === 'test',
});

// authMiddleware primeiro (injeta req.usuarioId), depois aiLimiter usa o ID como chave
router.post('/gemini',  authMiddleware, aiLimiter, aiController.gemini);
router.post('/groq',    authMiddleware, aiLimiter, aiController.groq);
router.post('/mistral', authMiddleware, aiLimiter, aiController.mistral);

module.exports = router;
