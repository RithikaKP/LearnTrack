import axios from 'axios';

const API_URL = 'http://localhost:5000/api/sessions/';

// Create session
const createSession = async (sessionData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, sessionData, config);

    return response.data;
};

// Complete session
const completeSession = async (sessionId, sessionData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.patch(`${API_URL}${sessionId}/complete`, sessionData, config);

    return response.data;
};

// Get stats
const getStats = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}stats`, config);

    return response.data;
};

// Get sessions with filters
const getSessions = async (days = 30, limit = 50, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: { days, limit }
    };

    const response = await axios.get(API_URL, config);

    return response.data;
};

const sessionService = {
    createSession,
    completeSession,
    getStats,
    getSessions
};

export default sessionService;
