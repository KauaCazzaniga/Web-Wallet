// Componente: subscriptionService
// Responsabilidade: chamadas à API /subscriptions
// Depende de: api.js (axios com interceptor JWT)

import api from './api';

export const getSubscriptions = () =>
  api.get('/subscriptions').then((r) => r.data);

export const createSubscription = (data) =>
  api.post('/subscriptions', data).then((r) => r.data);

export const updateSubscription = (id, data) =>
  api.put(`/subscriptions/${id}`, data).then((r) => r.data);

export const deleteSubscription = (id) =>
  api.delete(`/subscriptions/${id}`).then((r) => r.data);

export const lancarCobranca = (id, payload) =>
  api.post(`/subscriptions/${id}/lancar`, payload).then((r) => r.data);
