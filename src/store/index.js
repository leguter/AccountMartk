import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, {
  USE_MOCK,
  authService,
  setApiAccessToken,
  readPersistedUserSlice,
  USER_PERSIST_KEY,
} from '../services/api';
import { useLanguageStore } from '../i18n';

// ─── USER STORE ───────────────────────────────────────────────────────────────
export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      initData: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setInitData: (initData) => set({ initData }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      logout: () => {
        setApiAccessToken(null);
        set({
          user: null,
          isAuthenticated: false,
          initData: null,
          accessToken: null,
        });
      },

      initTelegram: async () => {
        // ── Guard: skip re-auth if already authenticated ──────────
        const current = get();
        if (current.isAuthenticated && current.accessToken && !current.error) {
          return null; // already logged in, do not re-auth
        }

        set({ error: null });
        const tg = window.Telegram?.WebApp;
        if (!tg) {
          console.warn('Telegram WebApp not available');
          if (!USE_MOCK) {
            const { accessToken, user } = readPersistedUserSlice();
            setApiAccessToken(accessToken);
            set({
              user,
              accessToken,
              isAuthenticated: !!accessToken,
              isLoading: false,
            });
          } else {
            setApiAccessToken(null);
            set({ isLoading: false });
          }
          return null;
        }

        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a0a');
        tg.setBackgroundColor('#0a0a0a');

        const initData = tg.initData;
        const unsafeUser = tg.initDataUnsafe?.user || null;

        if (USE_MOCK) {
          const resolvedUser = unsafeUser || {
            id: 123456789,
            username: 'demo_user',
            first_name: 'Demo',
            last_name: 'User',
            photo_url: null,
            language_code: 'en',
          };
          setApiAccessToken(null);
          set({
            user: resolvedUser,
            initData: initData || 'mock_init_data',
            accessToken: null,
            isAuthenticated: true,
            isLoading: false,
          });
          return tg;
        }

        if (initData) {
          // Render free tier cold-starts can take 60-120s.
          // Fire a quick ping first to wake the server up, then retry auth.
          console.log('Pinging server to wake up Render...');
          try {
            await api.get('/api/lots', { timeout: 120000 });
            console.log('Server wake-up successful!');
          } catch (e) {
            console.warn('Server wake-up ping failed (still sleeping):', e.message);
          }

          // Retry up to 3 times so the app succeeds once the server wakes up.
          const MAX_RETRIES = 3;
          let lastError = null;

          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              console.log(`Auth attempt ${attempt}/${MAX_RETRIES}...`);
              const res = await authService.loginWithTelegram(initData);

              if (res && res.token && res.user) {
                const u = res.user;
                const langCode = u.languageCode || tg.initDataUnsafe?.user?.language_code || 'ru';
                setApiAccessToken(res.token);
                set({
                  user: {
                    id: u.id,
                    username: u.username ?? null,
                    first_name: u.firstName || u.first_name || '',
                    last_name: u.lastName || u.last_name || '',
                    photo_url: u.photoUrl || u.photo_url || null,
                    bio: u.bio ?? null,
                    avatar: u.avatar ?? null,
                    language_code: langCode,
                  },
                  initData,
                  accessToken: res.token,
                  isAuthenticated: true,
                  isLoading: false,
                });
                // Sync language from Telegram (only if user hasn't picked manually)
                useLanguageStore.getState().syncFromTelegram(langCode);
                console.log('Telegram auth successful');
                return tg;
              } else {
                throw new Error('Invalid response format from auth service');
              }
            } catch (e) {
              lastError = e;
              console.warn(`Auth attempt ${attempt} failed:`, e.message);
              if (attempt < MAX_RETRIES) {
                // Wait 5s before retrying (server is waking up)
                await new Promise((r) => setTimeout(r, 5000));
              }
            }
          }

          // All attempts failed — try persisted session as fallback
          console.error('All auth attempts failed. Last error:', lastError);
          const { accessToken, user } = readPersistedUserSlice();

          if (accessToken) {
            // We have a valid saved session — use it silently, no error shown
            console.log('Falling back to persisted session');
            setApiAccessToken(accessToken);
            set({
              user,
              accessToken,
              initData,
              isAuthenticated: true,
              isLoading: false,
              error: null, // ← CRITICAL: clear error so App.jsx shows the app, not the error screen
            });
          } else {
            // Truly no session — format a user-friendly error message
            let displayError = lastError?.message || String(lastError);
            if (displayError.includes('net::ERR_NAME_NOT_RESOLVED')) {
              displayError = 'DNS Error: Backend URL could not be resolved.';
            } else if (displayError.includes('timeout')) {
              displayError = 'Connection Timeout: The server is sleeping. Please retry in 30 seconds.';
            }
            setApiAccessToken(null);
            set({
              user: null,
              initData,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: displayError,
            });
          }
          return tg;
        }

        const { accessToken, user } = readPersistedUserSlice();
        setApiAccessToken(accessToken);
        set({
          user,
          accessToken,
          initData: null,
          isAuthenticated: !!accessToken,
          isLoading: false,
        });
        return tg;
      },
    }),
    {
      name: USER_PERSIST_KEY,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setApiAccessToken(state.accessToken);
        }
      },
    }
  )
);

// ─── MARKETPLACE STORE ────────────────────────────────────────────────────────
export const useMarketplaceStore = create((set, get) => ({
  products: [],
  filteredProducts: [],
  selectedProduct: null,
  categories: ['all', 'telegram', 'instagram', 'youtube', 'tiktok', 'phone'],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'popular', // popular | price_asc | price_desc | newest
  isLoading: false,
  error: null,

  setProducts: (products) =>
    set({ products, filteredProducts: products }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setCategory: (category) => {
    const { products, searchQuery, sortBy } = get();
    set({ activeCategory: category });
    get().applyFilters(products, category, searchQuery, sortBy);
  },

  setSearch: (query) => {
    const { products, activeCategory, sortBy } = get();
    set({ searchQuery: query });
    get().applyFilters(products, activeCategory, query, sortBy);
  },

  setSort: (sortBy) => {
    const { products, activeCategory, searchQuery } = get();
    set({ sortBy });
    get().applyFilters(products, activeCategory, searchQuery, sortBy);
  },

  applyFilters: (products, category, query, sortBy) => {
    let filtered = [...products];

    if (category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.username && p.username.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default: // popular
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    set({ filteredProducts: filtered });
  },
}));

// ─── PAYMENT STORE ────────────────────────────────────────────────────────────
export const usePaymentStore = create((set) => ({
  paymentStatus: null, // null | 'pending' | 'success' | 'error'
  paymentError: null,
  lastPurchase: null,
  purchaseHistory: [],

  setPaymentStatus: (status) => set({ paymentStatus: status }),
  setPaymentError: (error) => set({ paymentError: error }),
  addPurchase: (purchase) =>
    set((state) => ({
      lastPurchase: purchase,
      purchaseHistory: [purchase, ...state.purchaseHistory],
      paymentStatus: 'success',
    })),
  resetPayment: () =>
    set({ paymentStatus: null, paymentError: null }),
}));

// ─── ORDER STORE ─────────────────────────────────────────────────────────────
// Structure: { id, lotId, lotTitle, buyerId, sellerId, status, amount, isConfirmedByBuyer, createdAt }
// Status: 'pending' | 'paid' | 'completed'
export const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],

      createOrder: ({ lotId, lotTitle, buyerId, sellerId, amount }) => {
        const order = {
          id: `order_${Date.now()}`,
          lotId,
          lotTitle,
          buyerId,
          sellerId,
          status: 'pending',
          amount,
          isConfirmedByBuyer: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },

      payOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'paid' } : o
          ),
        }));
      },

      confirmOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'completed', isConfirmedByBuyer: true }
              : o
          ),
        }));
        // Credit the seller's available balance
        useSellerStore.getState().creditBalance(order.sellerId, order.amount);
      },

      getOrderById: (orderId) => {
        return get().orders.find((o) => o.id === orderId) ?? null;
      },
    }),
    { name: 'accountmark-orders' }
  )
);

// ─── CHAT STORE ──────────────────────────────────────────────────────────────
// Messages: { id, orderId, senderId, text, type: 'text'|'system', createdAt }
export const useChatStore = create(
  persist(
    (set, get) => ({
      chats: {}, // { [orderId]: Message[] }

      getMessages: (orderId) => get().chats[orderId] ?? [],

      sendMessage: ({ orderId, senderId, text, type = 'text' }) => {
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          orderId,
          senderId,
          text,
          type,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          chats: {
            ...state.chats,
            [orderId]: [...(state.chats[orderId] ?? []), message],
          },
        }));
        return message;
      },
    }),
    { name: 'accountmark-chats' }
  )
);

// ─── SELLER STORE ─────────────────────────────────────────────────────────────
export const useSellerStore = create(
  persist(
    (set, get) => ({
      balances: {}, // { [userId]: { available, pending } }
      lots: [],     // lots created by current user

      getBalance: (userId) => {
        return get().balances[userId] ?? { available: 0, pending: 0 };
      },

      creditBalance: (userId, amount) => {
        set((state) => {
          const current = state.balances[userId] ?? { available: 0, pending: 0 };
          return {
            balances: {
              ...state.balances,
              [userId]: { ...current, available: current.available + amount },
            },
          };
        });
      },

      withdraw: (userId, amount) => {
        const current = get().balances[userId] ?? { available: 0, pending: 0 };
        if (current.available < amount) return false;
        set((state) => ({
          balances: {
            ...state.balances,
            [userId]: { ...current, available: current.available - amount },
          },
        }));
        return true;
      },

      addLot: (lot) => {
        set((state) => ({ lots: [lot, ...state.lots] }));
      },
    }),
    { name: 'accountmark-seller' }
  )
);
