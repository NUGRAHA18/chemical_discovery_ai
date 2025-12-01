import api from './api';

export const favoritesService = {
  getFavorites: async (params = {}) => {
    const { tags } = params;
    const response = await api.get('/favorites', {
      params: { tags: tags?.join(',') }
    });
    return response.data;
  },

  addFavorite: async (data) => {
    const response = await api.post('/favorites', data);
    return response.data;
  },

  updateFavorite: async (id, data) => {
    const response = await api.put(`/favorites/${id}`, data);
    return response.data;
  },

  deleteFavorite: async (id) => {
    const response = await api.delete(`/favorites/${id}`);
    return response.data;
  }
};