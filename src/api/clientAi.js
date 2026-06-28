import api from '../lib/axios'

// Returns { apiKey, context } for the group — used once per session to init client-side Gemini
export const getKeyAndContext = (groupId) => api.get('/client-ai/key', { params: { groupId } })
