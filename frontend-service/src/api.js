// API service for inventory management
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Get all items
export const getItems = async () => {
    const response = await api.get('/api/items');
    return response.data;
};

// Create new item
export const createItem = async (itemData) => {
    const response = await api.post('/api/items', itemData);
    return response.data;
};

export default api;
