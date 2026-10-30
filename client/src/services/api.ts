const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('landslide_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || 'API request failed';
      throw new Error(errorMsg);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(payload: { name: string; email: string; password: string; role?: string }) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Dashboard & Analytics
  async getDashboardSummary() {
    return this.request<any>('/analytics/dashboard');
  }

  async getTrends(params?: { locationId?: string; timeRange?: string }) {
    const q = new URLSearchParams();
    if (params?.locationId) q.append('locationId', params.locationId);
    if (params?.timeRange) q.append('timeRange', params.timeRange);
    return this.request<any>(`/analytics/trends?${q.toString()}`);
  }

  getCsvExportUrl(params?: { locationId?: string; timeRange?: string }): string {
    const q = new URLSearchParams();
    if (params?.locationId) q.append('locationId', params.locationId);
    if (params?.timeRange) q.append('timeRange', params.timeRange);
    return `${API_BASE}/analytics/export/csv?${q.toString()}`;
  }

  // Locations
  async getLocations(params?: { region?: string; riskLevel?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.region) q.append('region', params.region);
    if (params?.riskLevel) q.append('riskLevel', params.riskLevel);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return this.request<any[]>(`/locations?${q.toString()}`);
  }

  async getLocationById(id: string) {
    return this.request<any>(`/locations/${id}`);
  }

  async createLocation(data: any) {
    return this.request<any>('/locations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateLocation(id: string, data: any) {
    return this.request<any>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteLocation(id: string) {
    return this.request<any>(`/locations/${id}`, {
      method: 'DELETE'
    });
  }

  // Sensors
  async getSensors(params?: { location?: string; type?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.location) q.append('location', params.location);
    if (params?.type) q.append('type', params.type);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return this.request<any[]>(`/sensors?${q.toString()}`);
  }

  async getSensorById(id: string) {
    return this.request<any>(`/sensors/${id}`);
  }

  async createSensor(data: any) {
    return this.request<any>('/sensors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSensor(id: string, data: any) {
    return this.request<any>(`/sensors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSensor(id: string) {
    return this.request<any>(`/sensors/${id}`, {
      method: 'DELETE'
    });
  }

  // Readings
  async getReadings(params?: { location?: string; sensor?: string; sensorType?: string; limit?: number; page?: number }) {
    const q = new URLSearchParams();
    if (params?.location) q.append('location', params.location);
    if (params?.sensor) q.append('sensor', params.sensor);
    if (params?.sensorType) q.append('sensorType', params.sensorType);
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.page) q.append('page', params.page.toString());
    return this.request<any>(`/readings?${q.toString()}`);
  }

  async ingestReading(data: { sensorId: string; value: number; unit?: string; observedAt?: string }) {
    return this.request<any>('/readings/ingest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Assessments
  async getLatestAssessments() {
    return this.request<any[]>('/assessments/latest');
  }

  async getAssessmentConfig() {
    return this.request<any>('/assessments/config');
  }

  async recalculateLocationRisk(locationId: string) {
    return this.request<any>(`/assessments/recalculate/${locationId}`, {
      method: 'POST'
    });
  }

  // Alerts
  async getAlerts(params?: { severity?: string; status?: string; location?: string; limit?: number; page?: number }) {
    const q = new URLSearchParams();
    if (params?.severity) q.append('severity', params.severity);
    if (params?.status) q.append('status', params.status);
    if (params?.location) q.append('location', params.location);
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.page) q.append('page', params.page.toString());
    return this.request<any>(`/alerts?${q.toString()}`);
  }

  async acknowledgeAlert(id: string, notes?: string) {
    return this.request<any>(`/alerts/${id}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify({ notes: notes || '' })
    });
  }

  async resolveAlert(id: string) {
    return this.request<any>(`/alerts/${id}/resolve`, {
      method: 'PUT'
    });
  }

  // System & Simulation
  async getHealth() {
    return this.request<any>('/system/health');
  }

  async triggerSimulationPulse(scenario: 'normal' | 'storm_cloudburst' | 'dry_spell') {
    return this.request<any>('/system/simulate-pulse', {
      method: 'POST',
      body: JSON.stringify({ scenario })
    });
  }

  async resetDemoData() {
    return this.request<any>('/system/reset', {
      method: 'POST'
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    return this.request<any>(`/system/audit-logs?page=${page}&limit=${limit}`);
  }
}

export const api = new ApiService();
