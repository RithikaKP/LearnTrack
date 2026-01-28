import axios from 'axios';

const API_URL = 'http://localhost:5000/api/problems/';

// Get problems with filters
const getProblems = async (filters, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: filters
    };

    const response = await axios.get(API_URL, config);
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

// Get revision list
const getRevisionProblems = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}revision`, config);
    return response.data;
};

// Create problem
const createProblem = async (problemData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, problemData, config);
    return response.data;
};

// Update problem
const updateProblem = async (id, problemData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + id, problemData, config);
    return response.data;
};

// Delete problem
const deleteProblem = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + id, config);
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
