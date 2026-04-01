const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para Cadastro: POST /api/auth/registrar
router.post('/registrar', authController.registrar);

// Rota para Login: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;