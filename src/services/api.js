import axios from 'axios';
import { mockProducts, mockPurchaseHistory } from './mockData';

/**
 * Mock mode: default ON for local dev without a server.
 * Production: set VITE_USE_MOCK=false and VITE_API_URL=https://your-api.onrender.com
 */
export const USE_MOCK = false;

// In dev: Vite proxy forwards /api/* → http://localhost:4000 (no CORS issues)
// In prod: set VITE_API_URL to your deployed backend, e.g. https://your-api.onrender.com
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const USER_PERSIST_KEY = 'accountmark-user';

/** In-memory token so the first request after login works before persist flushes to localStorage. */
let accessTokenMemory = null;

export function setApiAccessToken(token) {
  accessTokenMemory = token || null;
}

function readPersistedAccessToken() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/** Bootstrap when WebApp initData is empty (e.g. browser) but a session was persisted. */
export function readPersistedUserSlice() {
  if (typeof window === 'undefined') return { accessToken: null, user: null };
  try {
    const raw = localStorage.getItem(USER_PERSIST_KEY);
    if (!raw) return { accessToken: null, user: null };
    const state = JSON.parse(raw)?.state;
    return {
      accessToken: state?.accessToken ?? null,
      user: state?.user ?? null,
    };
  } catch {
    return { accessToken: null, user: null };
  }
}

function resolveAccessToken() {
  return accessTokenMemory ?? readPersistedAccessToken();
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  const token = resolveAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const body = err.response?.data;
    const message =
      (typeof body?.message === 'string' && body.message) ||
      (typeof body?.error === 'string' && body.error) ||
      err.message ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

/** Map DB product (Prisma) to the richer shape the UI expects. */
export function normalizeProduct(p) {
  if (!p) return p;
  if (p.views !== undefined && p.stats !== undefined) return p;
  const title = p.title || '';
  const uname = title.startsWith('@') ? title.slice(1) : null;
  return {
    ...p,
    username: p.username ?? uname,
    views: p.views ?? 0,
    rating: p.rating ?? 4.5,
    reviews: p.reviews ?? 0,
    followers: p.followers ?? null,
    stats: p.stats ?? {
      age: '—',
      engagementRate: '—',
      avgViews: '—',
      country: '—',
    },
    seller: p.seller ?? null,
    badge: p.badge ?? null,
    badgeColor: p.badgeColor ?? null,
    verified: p.verified ?? false,
    tags: p.tags ?? [],
    originalPrice: p.originalPrice ?? null,
  };
}

// ─── AUTH (backend: POST /api/auth/telegram) ─────────────────────────────────
export const authService = {
  /** Exchange WebApp initData for JWT + user row. */
  async loginWithTelegram(initData) {
    if (USE_MOCK) {
      await delay(400);
      return {
        success: true,
        token: 'mock_jwt_token_xyz',
        user: { id: '123456789', username: 'demo_user', firstName: 'Demo' },
      };
    }
    return api.post('/api/auth/telegram', { initData });
  },

  async verifyUser(initData) {
    return authService.loginWithTelegram(initData);
  },

  async getProfile() {
    if (USE_MOCK) {
      await delay(300);
      return { success: true };
    }
    return api.get('/api/auth/profile');
  },
};

// ─── PRODUCTS (backend: GET /api/lots, GET /api/lots/:id) ───────────────
export const productService = {
  async getAll() {
    if (USE_MOCK) {
      await delay(700);
      return { success: true, data: mockProducts };
    }
    const r = await api.get('/api/lots');
    const raw = Array.isArray(r.lots) ? r.lots : [];
    const available = raw.filter((p) => !p.isSold);
    const data = available.map(normalizeProduct);
    return { success: true, data };
  },

  async getById(id) {
    if (USE_MOCK) {
      await delay(400);
      const product = mockProducts.find((p) => p.id === id);
      if (!product) throw new Error('Product not found');
      return { success: true, data: product };
    }
    const r = await api.get(`/api/lots/${id}`);
    if (!r.lot) throw new Error('Product not found');
    return { success: true, data: normalizeProduct(r.lot) };
  },

  async getFeatured() {
    const { data } = await productService.getAll();
    return { success: true, data: data.slice(0, 8) };
  },

  async search(query) {
    const { data } = await productService.getAll();
    const q = query.toLowerCase();
    const results = data.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.username && p.username.toLowerCase().includes(q))
    );
    return { success: true, data: results };
  },

  async getByCategory(category) {
    const { data } = await productService.getAll();
    const filtered =
      category === 'all' ? data : data.filter((p) => p.category === category);
    return { success: true, data: filtered };
  },

  async createLot(lotData) {
    return api.post('/api/lots', lotData);
  },

  async getMyLots(userId) {
    const r = await api.get(`/api/users/${userId}/lots`);
    return { success: true, data: r.lots.map(normalizeProduct) };
  },
};

// ─── ORDERS + PAYMENTS (backend: order → createInvoiceLink) ──────────────────
export const paymentService = {
  /** Real: POST /api/orders then POST /api/payments/create */
  async createInvoice(lotId) {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        invoiceUrl: `https://t.me/invoice/mock_${lotId}_${Date.now()}`,
        invoiceId: `inv_${Date.now()}`,
      };
    }
    const orderRes = await api.post('/api/orders', { lotId: String(lotId) });
    const orderId = orderRes.order?.id;
    if (!orderId) throw new Error('Could not create order');
    const payRes = await api.post('/api/payments/create', { orderId });
    const invoiceUrl = payRes.invoiceLink;
    if (!invoiceUrl) throw new Error('No invoice link from server');
    return {
      success: true,
      invoiceUrl,
      invoiceId: orderId,
    };
  },

  async confirmOrder(orderId) {
    return api.patch(`/api/orders/${orderId}/confirm`);
  },

  async getPurchaseHistory() {
    if (USE_MOCK) {
      await delay(500);
      return { success: true, data: mockPurchaseHistory };
    }
    const r = await api.get('/api/orders');
    const orders = Array.isArray(r.orders) ? r.orders : [];
    const data = orders
      .filter((o) => (o.status === 'paid' || o.status === 'completed') && o.lot)
      .map((o) => ({
        id: o.id,
        productId: o.lotId,
        productTitle: o.lot.title,
        price: o.lot.price,
        date: o.createdAt || new Date().toISOString(),
        status: o.status === 'completed' ? 'completed' : 'pending_confirmation',
      }));
    return { success: true, data };
  },

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

// ─── CHAT (backend: GET /api/chat/:orderId, POST /api/chat/:orderId) ──────────
export const chatService = {
  async getMessages(orderId) {
    const r = await api.get(`/api/chat/${orderId}`);
    return { success: true, data: r.messages || [] };
  },

  async sendMessage(orderId, text) {
    return api.post(`/api/chat/${orderId}`, { text });
  },
};

// ─── BALANCE (backend: GET /api/balance, POST /api/withdraw) ─────────────────
export const balanceService = {
  async getBalance() {
    return api.get('/api/balance');
  },

  async getTransactions() {
    const r = await api.get('/api/transactions');
    return { success: true, data: r.transactions || [] };
  },

  async withdraw(amount) {
    return api.post('/api/withdraw', { amount });
  },
};
