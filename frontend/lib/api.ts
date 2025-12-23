const API_BASE = '/api'; // Proxied to Backend

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any, token?: string, isMultipart: boolean = false) {
    const headers: any = {};

    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Backend expects Bearer token
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = isMultipart ? body : JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, config);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown Error' }));
        throw new Error(errorData.detail || 'API Request Failed');
    }

    return res.json();
}
