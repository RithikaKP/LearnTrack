import api from '../utils/api';

// Get dashboard stats
const getStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

// Get daily activity
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
