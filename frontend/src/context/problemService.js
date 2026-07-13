import api from '../utils/api';

const getProblems = async (filters) => {
    const response = await api.get('/problems/', {
        params: filters
    });
    return response.data;
};

const getStats = async () => {
    const response = await api.get('/problems/stats');
    return response.data;
};

const getRevisionProblems = async () => {
    const response = await api.get('/problems/revision');
    return response.data;
};

const createProblem = async (problemData) => {
    const response = await api.post('/problems/', problemData);
    return response.data;
};

const updateProblem = async (id, problemData) => {
    const response = await api.put('/problems/' + id, problemData);
    return response.data;
};

const deleteProblem = async (id) => {
    const response = await api.delete('/problems/' + id);
    return response.data;
};

const getConnectedPlatforms = async () => {
    const response = await api.get('/problems/platforms');
    return response.data;
};

const connectPlatform = async (platformData) => {
    const response = await api.post('/problems/platforms/connect', platformData);
    return response.data;
};

const disconnectPlatform = async (platformData) => {
    const response = await api.post('/problems/platforms/disconnect', platformData);
    return response.data;
};

const syncPlatforms = async () => {
    const response = await api.post('/problems/sync');
    return response.data;
};

const getCatalog = async (params) => {
    const response = await api.get('/problems/catalog', { params });
    return response.data;
};

const problemService = {
    getProblems,
    getStats,
    getRevisionProblems,
    createProblem,
    updateProblem,
    deleteProblem,
    getConnectedPlatforms,
    connectPlatform,
    disconnectPlatform,
    syncPlatforms,
    getCatalog
};

export default problemService;
