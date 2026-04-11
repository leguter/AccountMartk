import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User store
export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      initData: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setInitData: (initData) => set({ initData }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({ user: null, isAuthenticated: false, initData: null }),

      // Telegram WebApp init
      initTelegram: () => {
        const tg = window.Telegram?.WebApp;
        if (!tg) {
          console.warn('Telegram WebApp not available');
          set({ isLoading: false });
          return null;
        }

        tg.ready();
        tg.expand();

        // Set theme
        tg.setHeaderColor('#0a0a0a');
        tg.setBackgroundColor('#0a0a0a');

        const initData = tg.initData;
        const user = tg.initDataUnsafe?.user || null;

        // Mock user for development
        const resolvedUser = user || {
          id: 123456789,
          username: 'demo_user',
          first_name: 'Demo',
          last_name: 'User',
          photo_url: null,
          language_code: 'en',
        };

        set({
          user: resolvedUser,
          initData: initData || 'mock_init_data',
          isAuthenticated: true,
          isLoading: false,
        });

        return tg;
      },
    }),
    {
      name: 'accountmark-user',
      partialize: (state) => ({ user: state.user }),
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
          p.username?.toLowerCase().includes(q)
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
