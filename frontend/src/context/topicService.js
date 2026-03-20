import api from '../utils/api';

// Get topics for a subject
const getTopics = async (subjectId) => {
    const response = await api.get(`/topics/subject/${subjectId}`);
    return response.data;
};

// Create topic
const createTopic = async (topicData) => {
    const response = await api.post('/topics/', topicData);
    return response.data;
};

// Update topic
const updateTopic = async (topicId, topicData) => {
    const response = await api.put('/topics/' + topicId, topicData);
    return response.data;
};

// Update topic status
const updateTopicStatus = async (topicId, status) => {
    const response = await api.patch(
        `/topics/${topicId}/status`,
        { status }
    );
    return response.data;
};

// Delete topic
const deleteTopic = async (topicId) => {
    const response = await api.delete('/topics/' + topicId);
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
