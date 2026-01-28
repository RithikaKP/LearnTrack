import axios from 'axios';

const API_URL = 'http://localhost:5000/api/dashboard/';

// Get dashboard stats
const getStats = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}stats`, config);
    return response.data;
};

// Get daily activity
const getDailyActivity = async (date, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: { date }
    };

    const response = await axios.get(`${API_URL}daily-activity`, config);
    return response.data;
};

const dashboardService = {
    getStats,
    getDailyActivity
};

export default dashboardService;
