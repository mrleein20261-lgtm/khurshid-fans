// API Client helper for Khurshid Fans Admin Dashboard

const BASE_URL = "/api/v1";

// Simple state storage for Admin Token in LocalStorage
export function setAdminToken(token: string) {
  localStorage.setItem("kf_admin_token", token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem("kf_admin_token");
}

export function removeAdminToken() {
  localStorage.removeItem("kf_admin_token");
}

// Request builder with auth headers
async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Admin Auth
  login: (credentials: any) =>
    request("/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  
  getAdminMe: () => request("/admin/me"),
  
  changePassword: (data: any) =>
    request("/admin/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Dashboard Statistics
  getDashboardStats: () => request("/admin/dashboard-stats"),

  // Product CMS
  getProducts: () => request("/admin/products"),
  
  addProduct: (formData: FormData) => {
    const token = getAdminToken();
    return fetch(`${BASE_URL}/admin/products`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create product");
      }
      return res.json();
    });
  },

  editProduct: (id: string, formData: FormData) => {
    const token = getAdminToken();
    return fetch(`${BASE_URL}/admin/products/${id}`, {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to edit product");
      }
      return res.json();
    });
  },

  deleteProduct: (id: string) =>
    request(`/admin/products/${id}`, {
      method: "DELETE",
    }),

  // Order Management
  getOrders: (status?: string) =>
    request(`/admin/orders${status ? `?status=${status}` : ""}`),
  
  updateOrderStatus: (id: string, data: { status: string; paymentStatus?: string }) =>
    request(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // User Management
  getUsers: (search?: string) =>
    request(`/admin/users${search ? `?search=${search}` : ""}`),
  
  getUserDetail: (id: string) => request(`/admin/users/${id}`),
  
  toggleUserBan: (id: string) =>
    request(`/admin/users/${id}/ban`, {
      method: "PUT",
    }),

  // Complaint Support
  getComplaints: (status?: string) =>
    request(`/admin/complaints${status ? `?status=${status}` : ""}`),
  
  replyToComplaint: (id: string, data: { adminReply: string; status?: string }) =>
    request(`/admin/complaints/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Content CMS Page Edit
  editContent: (page: string, data: { body: string }) =>
    request(`/admin/content/${page}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  getContent: (page: string) => fetch(`${BASE_URL}/content/${page}`).then((res) => res.json()),

  // Chat APIs
  getChats: () => request("/admin/chats"),
  
  getChatMessages: (roomId: string) => request(`/admin/chats/${roomId}`),
  
  sendChatMessage: (roomId: string, data: { message: string; type?: string }) =>
    request(`/admin/chats/${roomId}/message`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // AI Recommendation (directly query Gemini API from dashboard console)
  getAIRecommendation: (data: { query: string; roomSize?: string; locationType?: string }) => {
    return fetch(`${BASE_URL}/ai/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error("AI query failed");
      }
      return res.json();
    });
  },
};
