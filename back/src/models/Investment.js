// Model: Investment
// Responsabilidade: Representa um item da carteira de investimentos do usuário
//   (CDB, LCI, Ações, etc.), isolado da coleção Wallet para não poluir o fluxo de caixa.
// Depende de: mongoose

'use strict';

const mongoose = require('mongoose');

/** Tipos de ativo permitidos — espelho de TIPOS_INVESTIMENTO no frontend */
const TIPOS_VALIDOS = ['CDB', 'LCI', 'LCA', 'Tesouro', 'Poupança', 'Ações', 'FII', 'Cripto', 'Outro'];

const investmentSchema = new mongoose.Schema(
    {
        usuario_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        /** Tipo de ativo: 'CDB' | 'LCI' | 'LCA' | 'Tesouro' | 'Poupança' | 'Ações' | 'FII' | 'Cripto' | 'Outro' */
        tipo: {
            type: String,
            enum: { values: TIPOS_VALIDOS, message: 'Tipo de ativo inválido: {VALUE}' },
            required: [true, 'Tipo é obrigatório.'],
        },

        /** Nome livre dado pelo usuário, ex: "CDB Nubank 110% CDI" */
        nome: {
            type: String,
            required: [true, 'Nome é obrigatório.'],
            trim: true,
            maxlength: [120, 'Nome deve ter no máximo 120 caracteres.'],
        },

        /** Indexador ou taxa, ex: "110% CDI", "IPCA+5,5%", "Variável" */
        taxa: {
            type: String,
            trim: true,
            maxlength: [60, 'Taxa deve ter no máximo 60 caracteres.'],
            default: '',
        },

        /** Total aportado em reais (≥ 0) */
        valor: {
            type: Number,
            required: [true, 'Valor é obrigatório.'],
            min: [0, 'Valor não pode ser negativo.'],
        },

        /** Rendimento acumulado calculado ou informado pelo usuário */
        rendimento: {
            type: Number,
            default: 0,
            min: [0, 'Rendimento não pode ser negativo.'],
        },

        /** Mês de início do investimento no formato "YYYY-MM" */
        mesInicio: {
            type: String,
            required: [true, 'Mês de início é obrigatório.'],
            match: [/^\d{4}-\d{2}$/, 'mesInicio deve estar no formato YYYY-MM.'],
        },

        /** Soft-delete: false = removido logicamente, não aparece nas listagens */
        ativo: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Índice composto para consultas do tipo "todos os investimentos ativos do usuário"
investmentSchema.index({ usuario_id: 1, ativo: 1 });

// Evita OverwriteModelError em hot-reload e em testes que importam o módulo múltiplas vezes
module.exports = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);

module.exports.TIPOS_VALIDOS = TIPOS_VALIDOS;
