import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  USE_MOCK,
  authService,
  setApiAccessToken,
  readPersistedUserSlice,
  USER_PERSIST_KEY,
} from '../services/api';

// User store
export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      initData: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setInitData: (initData) => set({ initData }),
      setLoading: (isLoading) => set({ isLoading }),

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
          try {
            const res = await authService.loginWithTelegram(initData);
            const u = res.user;
            setApiAccessToken(res.token);
            set({
              user: {
                id: u.id,
                username: u.username ?? null,
                first_name: u.firstName,
                last_name: '',
                photo_url: null,
                language_code: 'en',
              },
              initData,
              accessToken: res.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (e) {
            console.warn('Telegram auth failed:', e);
            setApiAccessToken(null);
            set({
              user: null,
              initData,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
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

// Marketplace store
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

// Cart / Payment store
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
