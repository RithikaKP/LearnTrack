import api from '../utils/api';

// Create session
const createSession = async (sessionData) => {
    const response = await api.post('/sessions/', sessionData);
    return response.data;
};

// Complete session
const completeSession = async (sessionId, sessionData) => {
    const response = await api.patch(`/sessions/${sessionId}/complete`, sessionData);
    return response.data;
};

// Get stats
const getStats = async () => {
    const response = await api.get('/sessions/stats');
    return response.data;
};

// Get sessions with filters
const getSessions = async (days = 30, limit = 50) => {
    const response = await api.get('/sessions/', {
        params: { days, limit }
    });
    return response.data;
};

const sessionService = {
    createSession,
    completeSession,
    getStats,
    getSessions
};

export default sessionService;
