import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const getImage = async () => {
  try {
    const response = await axios.get(`${API_URL}/get-data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching image from backend:', error);
    throw error;
  }
};
