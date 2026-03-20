import api from '../utils/api';

// Get problems with filters
const getProblems = async (filters) => {
    const response = await api.get('/problems/', {
        params: filters
    });
    return response.data;
};

// Get stats
const getStats = async () => {
    const response = await api.get('/problems/stats');
    return response.data;
};

// Get revision list
const getRevisionProblems = async () => {
    const response = await api.get('/problems/revision');
    return response.data;
};

// Create problem
const createProblem = async (problemData) => {
    const response = await api.post('/problems/', problemData);
    return response.data;
};

// Update problem
const updateProblem = async (id, problemData) => {
    const response = await api.put('/problems/' + id, problemData);
    return response.data;
};

// Delete problem
const deleteProblem = async (id) => {
    const response = await api.delete('/problems/' + id);
    return response.data;
};

const problemService = {
    getProblems,
    getStats,
    getRevisionProblems,
    createProblem,
    updateProblem,
    deleteProblem
};

export default problemService;
