const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordExpires: {
        type: Date,
        select: false,
    }
}, {
    timestamps: true
});

// --- O PULO DO GATO (MODERNO E SEGURO) ---
// Note que removemos o 'next' dos parâmetros
userSchema.pre('save', async function () {
    // Se a senha não foi modificada, saímos da função
    if (!this.isModified('password')) return;

    // Gera o salt e encripta a senha
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // Em funções async, o Mongoose entende que terminou quando a função chega ao fim.
    // Não precisa (e nem deve) chamar next().
});

// Evita OverwriteModelError em reloads (testes, hot-reload)
module.exports = mongoose.models.User || mongoose.model('User', userSchema);