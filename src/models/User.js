const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Garante que não teremos dois usuários com o mesmo e-mail
        lowercase: true,
    },
    senha: {
        type: String,
        required: true,
        select: false, // Regra de segurança: quando buscarmos o usuário, a senha NÃO vem junto por padrão
    }
}, {
    timestamps: true // Cria data de criação e atualização automaticamente
});

module.exports = mongoose.model('User', userSchema);