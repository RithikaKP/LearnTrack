import axios from 'axios';

const API_URL = 'http://localhost:5000/api/topics/';

// Get topics for a subject
const getTopics = async (subjectId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}subject/${subjectId}`, config);

    return response.data;
};

// Create topic
const createTopic = async (topicData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, topicData, config);

    return response.data;
};

// Update topic
const updateTopic = async (topicId, topicData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + topicId, topicData, config);

    return response.data;
};

// Update topic status
const updateTopicStatus = async (topicId, status, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.patch(
        `${API_URL}${topicId}/status`,
        { status },
        config
    );

    return response.data;
};

// Delete topic
const deleteTopic = async (topicId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + topicId, config);

    return response.data;
};

const topicService = {
    getTopics,
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
};

export default topicService;
