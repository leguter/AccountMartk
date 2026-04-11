import axios from 'axios';
import { mockProducts, mockPurchaseHistory } from './mockData';

const USE_MOCK = true; // Toggle when backend is ready
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.accountmark.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Telegram initData
api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// Simulate network delay for mocks
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authService = {
  async verifyUser(initData) {
    if (USE_MOCK) {
      await delay(400);
      return { success: true, token: 'mock_jwt_token_xyz' };
    }
    return api.post('/api/auth/verify', { initData });
  },

  async getProfile() {
    if (USE_MOCK) {
      await delay(300);
      return { success: true };
    }
    return api.get('/api/auth/profile');
  },
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const productService = {
  async getAll(params = {}) {
    if (USE_MOCK) {
      await delay(700);
      return { success: true, data: mockProducts };
    }
    return api.get('/api/products', { params });
  },

  async getById(id) {
    if (USE_MOCK) {
      await delay(400);
      const product = mockProducts.find((p) => p.id === id);
      if (!product) throw new Error('Product not found');
      return { success: true, data: product };
    }
    return api.get(`/api/products/${id}`);
  },

  async getFeatured() {
    if (USE_MOCK) {
      await delay(500);
      const featured = mockProducts.filter((p) => p.badge === 'HOT' || p.badge === 'PREMIUM');
      return { success: true, data: featured };
    }
    return api.get('/api/products/featured');
  },

  async search(query) {
    if (USE_MOCK) {
      await delay(400);
      const q = query.toLowerCase();
      const results = mockProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
      return { success: true, data: results };
    }
    return api.get('/api/products/search', { params: { q: query } });
  },

  async getByCategory(category) {
    if (USE_MOCK) {
      await delay(500);
      const data =
        category === 'all'
          ? mockProducts
          : mockProducts.filter((p) => p.category === category);
      return { success: true, data };
    }
    return api.get(`/api/products/category/${category}`);
  },
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentService = {
  async createInvoice(productId) {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        invoiceUrl: `https://t.me/invoice/mock_${productId}_${Date.now()}`,
        invoiceId: `inv_${Date.now()}`,
      };
    }
    return api.post('/api/payments/invoice', { productId });
  },

  async verifyPayment(invoiceId) {
    if (USE_MOCK) {
      await delay(1000);
      return { success: true, status: 'paid' };
    }
    return api.post('/api/payments/verify', { invoiceId });
  },

  async getPurchaseHistory(userId) {
    if (USE_MOCK) {
      await delay(500);
      return { success: true, data: mockPurchaseHistory };
    }
    return api.get(`/api/payments/history/${userId}`);
  },

  // Trigger native Telegram Stars payment
  async triggerStarsPayment(invoiceUrl) {
    return new Promise((resolve, reject) => {
      const tg = window.Telegram?.WebApp;
      if (!tg) return reject(new Error('Telegram not available'));

      tg.openInvoice(invoiceUrl, (status) => {
        if (status === 'paid') resolve({ success: true, status });
        else if (status === 'cancelled') reject(new Error('Payment cancelled'));
        else reject(new Error(`Payment failed: ${status}`));
      });
    });
  },
};
