import { useState, useEffect, useCallback, useRef } from 'react';
import { productService, paymentService, chatService, balanceService, userService } from '../services/api';
import { useMarketplaceStore, usePaymentStore, useUserStore } from '../store';

// Re-use the correctly configured axios instance from services/api
// (it reads VITE_API_URL and attaches auth headers automatically)
import api from '../services/api';

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

export function useMyOrders() {
  return useAsync(async () => {
    const res = await paymentService.getPurchaseHistory();
    return Array.isArray(res.data) ? res.data : [];
  }, []);
}

export function usePurchaseHistory() {
  return useMyOrders();
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
  const user = useUserStore((s) => s.user);
  const currentUserId = user?.id;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await chatService.getMessages(orderId);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Poll typing indicator every 10s (lightweight — just a boolean)
  const fetchTyping = useCallback(async () => {
    if (!orderId) return;
    try {
      const typing = await chatService.getTyping(orderId);
      setOtherIsTyping(typing);
    } catch (_) {
      // ignore — typing is best-effort
    }
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
    const msgTimer = setInterval(fetchMessages, 15000);
    const typingTimer = setInterval(fetchTyping, 10000);
    return () => {
      clearInterval(msgTimer);
      clearInterval(typingTimer);
    };
  }, [fetchMessages, fetchTyping]);

  const sendMessage = async (text) => {
    // Optimistic update — show message immediately
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMsg = {
      id: tempId,
      orderId,
      senderId: String(currentUserId),
      text,
      type: 'text',
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatService.sendMessage(orderId, text);
      if (res?.message) {
        // Replace the optimistic placeholder with the real server message
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
      }
    } catch (err) {
      // Roll back optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    }
  };

  /** Call this whenever the user types a character in the input. */
  const notifyTyping = useCallback(() => {
    if (!orderId) return;
    chatService.setTyping(orderId); // fire-and-forget
  }, [orderId]);

  return { messages, loading, error, otherIsTyping, sendMessage, notifyTyping, refresh: fetchMessages };
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
  const hasDataRef = useRef(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    // Only show loading spinner on first fetch — not on background polls
    if (!hasDataRef.current) setLoading(true);
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      hasDataRef.current = true;
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
    const timer = setInterval(fetchOrder, 30000);
    return () => clearInterval(timer);
  }, [fetchOrder]);

  return { order, loading, error, refresh: fetchOrder };
}

// Current user's lots
export function useMyLots() {
  const user = useUserStore((s) => s.user);
  return useAsync(async () => {
    if (!user?.id) return [];
    const res = await productService.getMyLots(user.id);
    return Array.isArray(res.data) ? res.data : [];
  }, [user?.id]);
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

// All user chats (buyer + seller), sorted by last message desc
export function useChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await chatService.getUserChats();
      const sorted = (res.data || []).sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setChats(sorted);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const timer = setInterval(fetchChats, 15000);
    return () => clearInterval(timer);
  }, [fetchChats]);

  return { chats, loading, error, refresh: fetchChats };
}

// Seller / public user profile
export function useSellerProfile(idOrUsername) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idOrUsername) return;
    setLoading(true);
    setError(null);
    userService
      .getProfile(idOrUsername)
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [idOrUsername]);

  return { user, loading, error };
}
