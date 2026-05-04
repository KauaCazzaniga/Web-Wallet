// Model: Goal (Cofrinho)
// Responsabilidade: Representa uma meta financeira com progresso (viagem, compra, reserva, etc.)
//   Armazena valorMeta e valorAtual separados para rastrear o progresso sem misturar com Wallet.
// Depende de: mongoose

'use strict';

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
    {
        usuario_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        /** Nome da meta: "Viagem Europa", "MacBook", "Reserva de Emergência" */
        nome: {
            type: String,
            required: [true, 'Nome é obrigatório.'],
            trim: true,
            maxlength: [100, 'Nome deve ter no máximo 100 caracteres.'],
        },

        /** Emoji representando o cofrinho, ex: "✈️", "💻", "🛡️" */
        icone: {
            type: String,
            default: '🐷',
            maxlength: [10, 'Ícone deve ter no máximo 10 caracteres.'],
        },

        /** Cor hexadecimal para a barra de progresso, ex: "#3b82f6" */
        cor: {
            type: String,
            default: '#3b82f6',
            match: [/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um hex válido (#rrggbb).'],
        },

        /** Valor alvo da meta em reais (> 0) */
        valorMeta: {
            type: Number,
            required: [true, 'Valor da meta é obrigatório.'],
            min: [1, 'Valor da meta deve ser pelo menos R$ 1,00.'],
        },

        /** Valor acumulado até agora — nunca negativo */
        valorAtual: {
            type: Number,
            default: 0,
            min: [0, 'Valor atual não pode ser negativo.'],
        },

        /** Prazo opcional no formato "YYYY-MM" */
        prazo: {
            type: String,
            default: null,
            validate: {
                validator: (v) => v === null || v === '' || /^\d{4}-\d{2}$/.test(v),
                message: 'Prazo deve estar no formato YYYY-MM ou ser nulo.',
            },
        },

        /** Soft-delete: false = cofrinho arquivado, não aparece nas listagens */
        ativo: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Índice composto para consultas "todos os cofrinhos ativos do usuário"
goalSchema.index({ usuario_id: 1, ativo: 1 });

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
