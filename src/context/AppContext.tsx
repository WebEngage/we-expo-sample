import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { COUPONS, getProduct } from '@/data/products';
import type {
  Account,
  Address,
  CartItem,
  InboxMessage,
  OptIns,
  Order,
  PaymentMethod,
  Payload,
  Product,
  User,
} from '@/types';
import { uid } from '@/utils/format';

const STORAGE_KEY = 'weshop:state:v1';

type Session = { type: 'user'; userId: string } | { type: 'guest'; guestId: string } | null;

interface Persisted {
  accounts: Account[];
  session: Session;
  cart: CartItem[];
  coupon: string | null;
  wishlist: string[];
  orders: Order[];
  addresses: Address[];
  optIns: OptIns;
  inbox: InboxMessage[];
  recentSearches: string[];
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

const DEMO_ACCOUNT: Account = {
  id: 'u_demo',
  isGuest: false,
  firstName: 'Demo',
  lastName: 'Shopper',
  email: 'demo@weshop.com',
  phone: '9876543210',
  gender: '',
  birthDate: '',
  city: 'Mumbai',
  customAttributes: {},
  password: 'demo1234',
};

const seedInbox = (): InboxMessage[] => [
  {
    id: 'm1',
    title: 'Welcome to WE Shop 🎉',
    body: 'Use code WELCOME10 to get 10% off your first order.',
    createdAt: minutesAgo(5),
    read: false,
    link: '/category/all',
  },
  {
    id: 'm2',
    title: 'Free shipping on orders over $100',
    body: 'Fill your cart past $100 and we cover the delivery.',
    createdAt: minutesAgo(180),
    read: false,
    link: '/cart',
  },
  {
    id: 'm3',
    title: 'New arrivals in Footwear',
    body: 'Fresh sneakers and trail runners just landed.',
    createdAt: minutesAgo(60 * 26),
    read: true,
    link: '/category/footwear',
  },
  {
    id: 'm4',
    title: 'Rate your recent purchase',
    body: 'Tell us how we did. It takes less than a minute.',
    createdAt: minutesAgo(60 * 70),
    read: true,
  },
];

const initialState = (): Persisted => ({
  accounts: [DEMO_ACCOUNT],
  session: null,
  cart: [],
  coupon: null,
  wishlist: [],
  orders: [],
  addresses: [],
  optIns: { push: true, email: true, sms: false, whatsapp: false },
  inbox: seedInbox(),
  recentSearches: [],
});

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export function computeTotals(cart: CartItem[], coupon: string | null): Totals {
  const subtotal = cart.reduce((sum, i) => sum + (getProduct(i.productId)?.price ?? 0) * i.qty, 0);
  let discount = 0;
  const c = coupon ? COUPONS[coupon] : undefined;
  if (c && (!c.minSubtotal || subtotal >= c.minSubtotal)) {
    discount = c.percent ? (subtotal * c.percent) / 100 : (c.flat ?? 0);
  }
  const shipping = cart.length === 0 || subtotal - discount >= 100 ? 0 : 9.99;
  const total = Math.max(0, subtotal - discount) + shipping;
  return { subtotal, discount, shipping, total };
}

interface Result {
  ok: boolean;
  message?: string;
}

interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AddOptions {
  qty?: number;
  size?: string;
  color?: string;
  extra?: Payload;
}

interface AppContextValue {
  hydrated: boolean;
  user: User | null;
  isGuest: boolean;
  login: (email: string, password: string, extra?: Payload) => Result;
  signup: (input: SignupInput, extra?: Payload) => Result;
  continueAsGuest: (extra?: Payload) => void;
  logout: () => void;
  updateProfile: (patch: Partial<Omit<User, 'id' | 'isGuest' | 'customAttributes'>>, customAttributes?: Payload) => void;

  cart: CartItem[];
  cartCount: number;
  coupon: string | null;
  totals: Totals;
  addToCart: (product: Product, opts?: AddOptions) => void;
  updateQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  applyCoupon: (code: string) => Result;
  removeCoupon: () => void;

  wishlist: string[];
  toggleWishlist: (productId: string, extra?: Payload) => boolean;

  orders: Order[];
  placeOrder: (address: Address, paymentMethod: PaymentMethod, extra?: Payload) => Order | null;

  addresses: Address[];
  saveAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;

  optIns: OptIns;
  setOptIn: (channel: keyof OptIns, value: boolean) => void;

  inbox: InboxMessage[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;

  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;

  toast: string | null;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...initialState(), ...JSON.parse(raw) });
      } catch {
        // fall back to the initial state
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const patch = useCallback((p: Partial<Persisted> | ((s: Persisted) => Partial<Persisted>)) => {
    setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const user = useMemo<User | null>(() => {
    const s = state.session;
    if (!s) return null;
    if (s.type === 'guest') {
      return {
        id: s.guestId,
        isGuest: true,
        firstName: 'Guest',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        birthDate: '',
        city: '',
        customAttributes: {},
      };
    }
    const acc = state.accounts.find((a) => a.id === s.userId);
    if (!acc) return null;
    const { password: _password, ...rest } = acc;
    return rest;
  }, [state.session, state.accounts]);

  const login: AppContextValue['login'] = (email, password) => {
    const acc = state.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!acc) return { ok: false, message: 'No account found for this email. Please sign up.' };
    if (acc.password !== password) return { ok: false, message: 'Incorrect password.' };
    patch({ session: { type: 'user', userId: acc.id } });
    return { ok: true };
  };

  const signup: AppContextValue['signup'] = (input, extra) => {
    if (state.accounts.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    const account: Account = {
      id: `u_${uid()}`,
      isGuest: false,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      gender: '',
      birthDate: '',
      city: '',
      customAttributes: extra ?? {},
      password: input.password,
    };
    patch((s) => ({ accounts: [...s.accounts, account], session: { type: 'user', userId: account.id } }));
    return { ok: true };
  };

  const continueAsGuest: AppContextValue['continueAsGuest'] = () => {
    patch({ session: { type: 'guest', guestId: `guest_${uid()}` } });
  };

  const logout = () => {
    patch({ session: null, cart: [], coupon: null });
  };

  const updateProfile: AppContextValue['updateProfile'] = (p, customAttributes) => {
    if (state.session?.type !== 'user') return;
    const userId = state.session.userId;
    patch((s) => ({
      accounts: s.accounts.map((a) =>
        a.id === userId
          ? { ...a, ...p, customAttributes: customAttributes ? { ...a.customAttributes, ...customAttributes } : a.customAttributes }
          : a,
      ),
    }));
  };

  const addToCart: AppContextValue['addToCart'] = (product, opts = {}) => {
    const qty = opts.qty ?? 1;
    const key = `${product.id}|${opts.size ?? ''}|${opts.color ?? ''}`;
    patch((s) => {
      const existing = s.cart.find((i) => i.key === key);
      if (existing) {
        return { cart: s.cart.map((i) => (i.key === key ? { ...i, qty: i.qty + qty, extra: opts.extra ?? i.extra } : i)) };
      }
      return {
        cart: [...s.cart, { key, productId: product.id, qty, size: opts.size, color: opts.color, extra: opts.extra }],
      };
    });
  };

  const updateQty: AppContextValue['updateQty'] = (key, qty) => {
    patch((s) => ({
      cart: qty <= 0 ? s.cart.filter((i) => i.key !== key) : s.cart.map((i) => (i.key === key ? { ...i, qty } : i)),
    }));
  };

  const removeFromCart: AppContextValue['removeFromCart'] = (key) => {
    patch((s) => ({ cart: s.cart.filter((i) => i.key !== key) }));
  };

  const applyCoupon: AppContextValue['applyCoupon'] = (code) => {
    const c = code.trim().toUpperCase();
    const def = COUPONS[c];
    if (!def) return { ok: false, message: 'Invalid coupon code.' };
    const { subtotal } = computeTotals(state.cart, null);
    if (def.minSubtotal && subtotal < def.minSubtotal) {
      return { ok: false, message: `Add $${(def.minSubtotal - subtotal).toFixed(2)} more to use ${c}.` };
    }
    patch({ coupon: c });
    return { ok: true, message: `${c} applied (${def.label}).` };
  };

  const removeCoupon = () => patch({ coupon: null });

  const toggleWishlist: AppContextValue['toggleWishlist'] = (productId) => {
    const has = state.wishlist.includes(productId);
    patch((s) => ({ wishlist: has ? s.wishlist.filter((id) => id !== productId) : [...s.wishlist, productId] }));
    return !has;
  };

  const placeOrder: AppContextValue['placeOrder'] = (address, paymentMethod, extra) => {
    if (state.cart.length === 0) return null;
    const totals = computeTotals(state.cart, state.coupon);
    const order: Order = {
      id: `WE${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      items: state.cart.map((i) => {
        const p = getProduct(i.productId)!;
        return { productId: p.id, name: p.name, image: p.image, price: p.price, qty: i.qty, size: i.size, color: i.color };
      }),
      ...totals,
      coupon: state.coupon,
      paymentMethod,
      address,
      status: 'Placed',
      extra,
    };
    const confirmation: InboxMessage = {
      id: `m_${uid()}`,
      title: `Order ${order.id} placed`,
      body: `We've received your order of ${order.items.length} item(s). We'll let you know when it ships.`,
      createdAt: order.createdAt,
      read: false,
    };
    patch((s) => ({ orders: [order, ...s.orders], cart: [], coupon: null, inbox: [confirmation, ...s.inbox] }));
    return order;
  };

  const saveAddress: AppContextValue['saveAddress'] = (address) => {
    patch((s) => ({ addresses: [...s.addresses, { ...address, id: `a_${uid()}` }] }));
  };

  const removeAddress: AppContextValue['removeAddress'] = (id) => {
    patch((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));
  };

  const setOptIn: AppContextValue['setOptIn'] = (channel, value) => {
    patch((s) => ({ optIns: { ...s.optIns, [channel]: value } }));
  };

  const markRead: AppContextValue['markRead'] = (id) => {
    patch((s) => ({ inbox: s.inbox.map((m) => (m.id === id ? { ...m, read: true } : m)) }));
  };

  const markAllRead = () => patch((s) => ({ inbox: s.inbox.map((m) => ({ ...m, read: true })) }));

  const addRecentSearch: AppContextValue['addRecentSearch'] = (q) => {
    const term = q.trim();
    if (!term) return;
    patch((s) => ({ recentSearches: [term, ...s.recentSearches.filter((r) => r !== term)].slice(0, 6) }));
  };

  const clearRecentSearches = () => patch({ recentSearches: [] });

  const totals = useMemo(() => computeTotals(state.cart, state.coupon), [state.cart, state.coupon]);

  const value: AppContextValue = {
    hydrated,
    user,
    isGuest: user?.isGuest ?? false,
    login,
    signup,
    continueAsGuest,
    logout,
    updateProfile,
    cart: state.cart,
    cartCount: state.cart.reduce((n, i) => n + i.qty, 0),
    coupon: state.coupon,
    totals,
    addToCart,
    updateQty,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    wishlist: state.wishlist,
    toggleWishlist,
    orders: state.orders,
    placeOrder,
    addresses: state.addresses,
    saveAddress,
    removeAddress,
    optIns: state.optIns,
    setOptIn,
    inbox: state.inbox,
    unreadCount: state.inbox.filter((m) => !m.read).length,
    markRead,
    markAllRead,
    recentSearches: state.recentSearches,
    addRecentSearch,
    clearRecentSearches,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
