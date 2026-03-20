import api from '../utils/api';

// Create new subject
const createSubject = async (subjectData) => {
    const response = await api.post('/subjects/', subjectData);
    return response.data;
};

// Get user subjects
const getSubjects = async () => {
    const response = await api.get('/subjects/');
    return response.data;
};

// Get single subject
const getSubject = async (subjectId) => {
    const response = await api.get('/subjects/' + subjectId);
    return response.data;
};

// Update subject
const updateSubject = async (subjectId, subjectData) => {
    const response = await api.put('/subjects/' + subjectId, subjectData);
    return response.data;
};

// Delete subject
const deleteSubject = async (subjectId) => {
    const response = await api.delete('/subjects/' + subjectId);
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
