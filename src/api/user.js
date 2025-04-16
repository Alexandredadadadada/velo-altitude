import axios from 'axios';

const BASE_URL = '/api/user';

export const userApi = {
  getProfile: async () => {
    const response = await axios.get(`${BASE_URL}/profile`);
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await axios.put(`${BASE_URL}/profile`, data);
    return response.data;
  }
};
