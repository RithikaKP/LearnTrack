import api from '../utils/api';

const createSession = async (sessionData) => {
    const response = await api.post('/sessions/', sessionData);
    return response.data;
};

const completeSession = async (sessionId, sessionData) => {
    const response = await api.patch(`/sessions/${sessionId}/complete`, sessionData);
    return response.data;
};

const getStats = async () => {
    const response = await api.get('/sessions/stats');
    return response.data;
};

const getSessions = async (filters = {}) => {
    const params = typeof filters === 'object' ? filters : { days: filters };
    const response = await api.get('/sessions/', { params });
    return response.data;
};

const sessionService = {
    createSession,
    completeSession,
    getStats,
    getSessions
};

export default sessionService;
