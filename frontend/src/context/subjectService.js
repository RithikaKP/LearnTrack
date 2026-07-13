import api from '../utils/api';

const createSubject = async (subjectData) => {
    const response = await api.post('/subjects/', subjectData);
    return response.data;
};

const getSubjects = async () => {
    const response = await api.get('/subjects/');
    return response.data;
};

const getSubject = async (subjectId) => {
    const response = await api.get('/subjects/' + subjectId);
    return response.data;
};

const updateSubject = async (subjectId, subjectData) => {
    const response = await api.put('/subjects/' + subjectId, subjectData);
    return response.data;
};

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
