import api from '../utils/api';

const getNotes = async (filters) => {
    const response = await api.get('/notes/', {
        params: filters
    });
    return response.data;
};

const createNote = async (noteData) => {
    const response = await api.post('/notes/', noteData);
    return response.data;
};

const updateNote = async (id, noteData) => {
    const response = await api.put('/notes/' + id, noteData);
    return response.data;
};

const togglePin = async (id) => {
    const response = await api.patch(`/notes/${id}/pin`, {});
    return response.data;
};

const deleteNote = async (id) => {
    const response = await api.delete('/notes/' + id);
    return response.data;
};

const noteService = {
    getNotes,
    createNote,
    updateNote,
    togglePin,
    deleteNote
};

export default noteService;
