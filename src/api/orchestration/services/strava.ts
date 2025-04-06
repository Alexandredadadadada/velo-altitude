import axios from 'axios';

const STRAVA_BASE_URL = 'https://www.strava.com/api/v3';

export class StravaService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;
  
  constructor() {
    // Initialize with tokens from env
    this.refreshToken = process.env.STRAVA_REFRESH_TOKEN || null;
    this.initializeFromStorage();
  }
  
  private initializeFromStorage() {
    // In browser environment
    if (typeof window !== 'undefined') {
      try {
        const tokenData = localStorage.getItem('strava_tokens');
        if (tokenData) {
          const { access_token, refresh_token, expires_at } = JSON.parse(tokenData);
          this.accessToken = access_token;
          this.refreshToken = refresh_token || this.refreshToken;
          this.expiresAt = expires_at;
        }
      } catch (error) {
        console.error('Failed to initialize Strava tokens from storage', error);
      }
    }
  }
  
  // Ensure token is valid before making API calls
  private async ensureValidToken() {
    const now = Math.floor(Date.now() / 1000);
    
    if (!this.accessToken || now >= this.expiresAt) {
      await this.refreshAccessToken();
    }
    
    return this.accessToken;
  }
  
  // Refresh the access token when expired
  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available for Strava');
    }
    
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      });
      
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.expiresAt = response.data.expires_at;
      
      // Store updated tokens in browser environment
      if (typeof window !== 'undefined') {
        localStorage.setItem('strava_tokens', JSON.stringify({
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_at: this.expiresAt
        }));
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to refresh Strava token', error);
      throw error;
    }
  }
  
  // API methods
  async getAthleteProfile() {
    const token = await this.ensureValidToken();
    return axios.get(`${STRAVA_BASE_URL}/athlete`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => response.data);
  }
  
  async getActivities(params = {}) {
    const token = await this.ensureValidToken();
    return axios.get(`${STRAVA_BASE_URL}/athlete/activities`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    }).then(response => response.data);
  }
  
  async getActivity(id: string) {
    const token = await this.ensureValidToken();
    return axios.get(`${STRAVA_BASE_URL}/activities/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => response.data);
  }
  
  async getRoutes() {
    const token = await this.ensureValidToken();
    return axios.get(`${STRAVA_BASE_URL}/athletes/me/routes`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => response.data);
  }
  
  async getRoute(id: string) {
    const token = await this.ensureValidToken();
    return axios.get(`${STRAVA_BASE_URL}/routes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => response.data);
  }
  
  async uploadActivity(file: File, data: any) {
    const token = await this.ensureValidToken();
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    
    return axios.post(`${STRAVA_BASE_URL}/uploads`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => response.data);
  }
}
