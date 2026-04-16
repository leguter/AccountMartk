import { useState, useEffect, useCallback, useRef } from 'react';
import { productService, paymentService, chatService, balanceService } from '../services/api';
import { useMarketplaceStore, usePaymentStore, useUserStore } from '../store';
import axios from 'axios';

const _api = axios.create({
  baseURL: (import.meta.env.BASE_URL || '').replace(/\/$/, '') || 'https://account-martk.vercel.app/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
_api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) config.headers['X-Telegram-Init-Data'] = initData;
  const token = (() => {
    try {
      const raw = localStorage.getItem('accountmark-user');
      return raw ? JSON.parse(raw)?.state?.accessToken : null;
    } catch { return null; }
  })();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
_api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const body = err.response?.data;
    const message = (typeof body?.message === 'string' && body.message) ||
      (typeof body?.error === 'string' && body.error) ||
      err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// Generic async hook
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setState({ data: null, loading: true, error: null });

    asyncFn()
      .then((data) => {
        if (mountedRef.current) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (mountedRef.current) setState({ data: null, loading: false, error: err.message });
      });

    return () => { mountedRef.current = false; };
  }, deps);

  return state;
}

// Products list
export function useProducts() {
  const { setProducts, setLoading, setError, filteredProducts, isLoading, error } =
    useMarketplaceStore();

  useEffect(() => {
    setLoading(true);
    productService
      .getAll()
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [setProducts, setLoading, setError]);

  return { products: filteredProducts, isLoading, error };
}

// Single product
export function useProduct(id) {
  const { selectedProduct, setSelectedProduct } = useMarketplaceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    // Use cached if same product
    if (selectedProduct?.id == id) return;

    setIsLoading(true);
    productService
      .getById(id)
      .then((res) => {
        setSelectedProduct(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [id]);

  return { product: selectedProduct?.id == id ? selectedProduct : null, isLoading, error };
}

// Purchase history
export function usePurchaseHistory() {
  return useAsync(() => paymentService.getPurchaseHistory(), []);
}

// Payment flow
export function usePayment() {
  const { setPaymentStatus, setPaymentError, addPurchase, resetPayment } = usePaymentStore();
  const paymentStatus = usePaymentStore((s) => s.paymentStatus);
  const paymentError = usePaymentStore((s) => s.paymentError);

  const purchase = useCallback(async (product) => {
    setPaymentStatus('pending');
    setPaymentError(null);

    try {
      // 1. Create order + invoice on backend
      const { invoiceUrl, invoiceId } = await paymentService.createInvoice(product.id);

      // 2. Trigger Telegram Stars payment if in TG environment
      const tg = window.Telegram?.WebApp;
      if (tg && tg.openInvoice) {
        await paymentService.triggerStarsPayment(invoiceUrl);
      } else {
        // Dev/browser — simulate the payment delay
        await new Promise((r) => setTimeout(r, 800));
      }

      // 3. Success — backend will process via webhook
      addPurchase({
        id: invoiceId,
        productId: product.id,
        productTitle: product.title || product.username,
        price: product.price,
        date: new Date().toISOString(),
        status: 'pending_confirmation',
      });

      setPaymentStatus('success');
      return invoiceId;

    } catch (err) {
      setPaymentStatus('error');
      setPaymentError(err.message || 'Payment failed');
      throw err;
    }
  }, [setPaymentStatus, setPaymentError, addPurchase]);

  return { purchase, paymentStatus, paymentError, resetPayment };
}

// Debounced value
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Chat messages
export function useChat(orderId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await chatService.getMessages(orderId);
      setMessages(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
    // Simple polling every 5s
    const timer = setInterval(fetchMessages, 5000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  const sendMessage = async (text) => {
    try {
      const res = await chatService.sendMessage(orderId, text);
      setMessages((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return { messages, loading, error, sendMessage, refresh: fetchMessages };
}

// User balance
export function useBalance() {
  const [state, setState] = useState({ balance: 0, pendingBalance: 0, loading: true, error: null });

  const fetchBalance = useCallback(async () => {
    try {
      const res = await balanceService.getBalance();
      setState({ ...res, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { ...state, refresh: fetchBalance };
}

// Single order
export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await _api.get(`/api/orders/${orderId}`);
      setOrder(res.order);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refresh: fetchOrder };
}

// Current user's lots
export function useMyLots() {
  const user = useUserStore((s) => s.user);
  return useAsync(() => productService.getMyLots(user?.id), [user?.id]);
}

// Telegram haptics
export function useHaptic() {
  const impact = useCallback((style = 'light') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  }, []);

  const notification = useCallback((type = 'success') => {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  }, []);

  const selection = useCallback(() => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  }, []);

  return { impact, notification, selection };
}
