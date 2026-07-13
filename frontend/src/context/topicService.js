import api from '../utils/api';

const getTopics = async (subjectId) => {
    const response = await api.get(`/topics/subject/${subjectId}`);
    return response.data;
};

const createTopic = async (topicData) => {
    const response = await api.post('/topics/', topicData);
    return response.data;
};

const updateTopic = async (topicId, topicData) => {
    const response = await api.put('/topics/' + topicId, topicData);
    return response.data;
};

const updateTopicStatus = async (topicId, status) => {
    const response = await api.patch(
        `/topics/${topicId}/status`,
        { status }
    );
    return response.data;
};

const deleteTopic = async (topicId) => {
    const response = await api.delete('/topics/' + topicId);
    return response.data;
};

const generateSuggestions = async (subjectName, learningGoal) => {
    const response = await api.post('/topics/generate', { subjectName, learningGoal });
    return response.data;
};

const topicService = {
    getTopics,
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
    generateSuggestions,
};

export default topicService;
