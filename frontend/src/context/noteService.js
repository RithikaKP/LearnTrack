import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notes/';

// Get notes with filters
const getNotes = async (filters, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: filters
    };

    const response = await axios.get(API_URL, config);
    return response.data;
};

// Create note
const createNote = async (noteData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, noteData, config);
    return response.data;
};

// Update note
const updateNote = async (id, noteData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + id, noteData, config);
    return response.data;
};

// Toggle pin
const togglePin = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.patch(`${API_URL}${id}/pin`, {}, config);
    return response.data;
};

// Delete note
const deleteNote = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + id, config);
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
