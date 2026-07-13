import api from '../utils/api';

const getStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

const getDailyActivity = async (date) => {
    const response = await api.get('/dashboard/daily-activity', {
        params: { date }
    });
    return response.data;
};

const dashboardService = {
    getStats,
    getDailyActivity
};

export default dashboardService;
