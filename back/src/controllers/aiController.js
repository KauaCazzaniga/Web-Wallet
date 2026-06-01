const axios = require('axios');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

const repassarErro = (err, res) => {
    const providerStatus = err.response?.status || 502;
    // 401/403 from the AI provider mean a bad server-side API key, not a user auth failure.
    // Forwarding them as-is would trigger the frontend's JWT-expired interceptor incorrectly.
    const status = [401, 403].includes(providerStatus) ? 502 : providerStatus;
    const body = err.response?.data || { error: err.message };
    return res.status(status).json(body);
};

const gemini = async (req, res) => {
    try {
        const { model = 'gemini-2.5-flash', payload } = req.body;
        if (!payload) {
            return res.status(400).json({ error: 'Campo "payload" obrigatório.' });
        }

        const url = `${GEMINI_BASE}/${model}:generateContent`;
        const { data } = await axios.post(url, payload, {
            headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
            timeout: 30000,
        });
        return res.json(data);
    } catch (err) {
        return repassarErro(err, res);
    }
};

const groq = async (req, res) => {
    try {
        const { data } = await axios.post(GROQ_ENDPOINT, req.body, {
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            timeout: 30000,
        });
        return res.json(data);
    } catch (err) {
        return repassarErro(err, res);
    }
};

const mistral = async (req, res) => {
    try {
        const { data } = await axios.post(MISTRAL_ENDPOINT, req.body, {
            headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
            timeout: 30000,
        });
        return res.json(data);
    } catch (err) {
        return repassarErro(err, res);
    }
};

module.exports = { gemini, groq, mistral };

