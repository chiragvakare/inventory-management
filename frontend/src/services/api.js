import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Don't show toast for timeout — just reject silently
    if (err.code === 'ECONNABORTED') return Promise.reject(err)

    const message =
      err.response?.data?.detail ||
      (Array.isArray(err.response?.data?.detail)
        ? err.response.data.detail.map((e) => e.msg).join(', ')
        : null) ||
      err.message ||
      'An unexpected error occurred'
    toast.error(typeof message === 'string' ? message : JSON.stringify(message))
    return Promise.reject(err)
  },
)

// Products
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, adjustment) => api.patch(`/products/${id}/adjust-stock`, null, { params: { adjustment } }),
  getCategories: () => api.get('/products/categories'),
}

// Customers
export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
}

// Orders
export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
}

// Dashboard
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getLowStock: () => api.get('/dashboard/low-stock-products'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getRevenueChart: (days) => api.get('/dashboard/revenue-chart', { params: { days } }),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getOrderStatusDistribution: () => api.get('/dashboard/order-status-distribution'),
}

export default api
