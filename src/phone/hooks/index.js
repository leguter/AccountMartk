import { useState, useEffect, useCallback, useRef } from 'react';
import { productService, paymentService } from '../services/api';
import { useMarketplaceStore, usePaymentStore } from '../store';

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
  }, []);

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
    if (selectedProduct?.id === id) return;

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

  return { product: selectedProduct?.id === id ? selectedProduct : null, isLoading, error };
}

// Purchase history
export function usePurchaseHistory(userId) {
  return useAsync(() => paymentService.getPurchaseHistory(userId), [userId]);
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
      // 1. Create invoice on backend
      const { invoiceUrl, invoiceId } = await paymentService.createInvoice(product.id);

      // 2. Check if Telegram is available
      const tg = window.Telegram?.WebApp;

      if (tg && tg.openInvoice) {
        // Real Telegram Stars payment
        await paymentService.triggerStarsPayment(invoiceUrl);
      } else {
        // Dev/mock mode — simulate payment
        await new Promise((r) => setTimeout(r, 1500));
      }

      // 3. Verify on backend
      await paymentService.verifyPayment(invoiceId);

      // 4. Success
      addPurchase({
        id: invoiceId,
        productId: product.id,
        productTitle: product.title || product.username,
        price: product.price,
        date: new Date().toISOString(),
        status: 'completed',
      });

    } catch (err) {
      setPaymentStatus('error');
      setPaymentError(err.message || 'Payment failed');
    }
  }, []);

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
