const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const aiController = require('../controllers/aiController');

// Todas as rotas exigem JWT — apenas usuários autenticados consomem as chaves de IA
router.post('/gemini',  authMiddleware, aiController.gemini);
router.post('/groq',    authMiddleware, aiController.groq);
router.post('/mistral', authMiddleware, aiController.mistral);

module.exports = router;
