const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(refreshToken) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Chat endpoints
  async getConversations() {
    return this.request('/chat/conversations');
  }

  async createConversation(title) {
    return this.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getMessages(conversationId, page = 1, limit = 50) {
    return this.request(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(conversationId, content) {
    return this.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteConversation(conversationId) {
    return this.request(`/chat/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async updateConversation(conversationId, title) {
    return this.request(`/chat/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    return this.request(`/user/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
  }

  async markNotificationRead(notificationId) {
    return this.request(`/user/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/user/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/user/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async getUserStats() {
    return this.request('/user/stats');
  }
}

export default new ApiService();
