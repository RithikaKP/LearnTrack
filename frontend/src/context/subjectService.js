import axios from 'axios';

const API_URL = 'http://localhost:5000/api/subjects/';

// Create new subject
const createSubject = async (subjectData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, subjectData, config);

    return response.data;
};

// Get user subjects
const getSubjects = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL, config);

    return response.data;
};

// Get single subject
const getSubject = async (subjectId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL + subjectId, config);

    return response.data;
};

// Update subject
const updateSubject = async (subjectId, subjectData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + subjectId, subjectData, config);

    return response.data;
};

// Delete subject
const deleteSubject = async (subjectId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + subjectId, config);

    return response.data;
};

const subjectService = {
    createSubject,
    getSubjects,
    getSubject,
    updateSubject,
    deleteSubject,
};

export default subjectService;
