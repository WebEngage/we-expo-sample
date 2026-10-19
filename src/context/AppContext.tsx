import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import WebEngageManager from '@/analytics/WebEngageManager';
import { CURRENCY, orderProps, productProps, syncUser, track } from '@/analytics/tracking';
import { COUPONS, getProduct } from '@/data/products';
import type {
  Account,
  Address,
  CartItem,
  OptIns,
  Order,
  PaymentMethod,
  Payload,
  Product,
  User,
} from '@/types';
import { uid } from '@/utils/format';

// v2: the demo account is now `sn_ios` and the stored static inbox is gone, so old saved state is not reused.
const STORAGE_KEY = 'weshop:state:v2';

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
  recentSearches: string[];
}

const DEMO_ACCOUNT: Account = {
  id: 'sn_ios',
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

const initialState = (): Persisted => ({
  accounts: [DEMO_ACCOUNT],
  session: null,
  cart: [],
  coupon: null,
  wishlist: [],
  orders: [],
  addresses: [],
  optIns: { push: true, email: true, sms: false, whatsapp: false },
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
        if (raw) {
          const restored: Persisted = { ...initialState(), ...JSON.parse(raw) };
          setState(restored);
          // A restored session bypasses the login screen, so identify the user here.
          const session = restored.session;
          if (session?.type === 'user') {
            const acc = restored.accounts.find((a) => a.id === session.userId);
            if (acc) {
              const { password: _password, ...profile } = acc;
              WebEngageManager.login(acc.id);
              syncUser(profile, acc.customAttributes);
            }
          }
        }
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

  const login: AppContextValue['login'] = (email, password, extra) => {
    const acc = state.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!acc) return { ok: false, message: 'No account found for this email. Please sign up.' };
    if (acc.password !== password) return { ok: false, message: 'Incorrect password.' };
    patch({ session: { type: 'user', userId: acc.id } });
    const { password: _password, ...profile } = acc;
    WebEngageManager.login(acc.id);
    syncUser(profile, { ...acc.customAttributes, ...extra });
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
    const { password: _password, ...profile } = account;
    WebEngageManager.login(account.id);
    syncUser(profile, extra);
    track('Signup Completed', { Method: 'Email' }, extra);
    return { ok: true };
  };

  const continueAsGuest: AppContextValue['continueAsGuest'] = (extra) => {
    patch({ session: { type: 'guest', guestId: `guest_${uid()}` } });
    track('Guest Session Started', {}, extra);
  };

  const logout = () => {
    // A guest was never identified, so there is nothing to log out in WebEngage.
    if (state.session?.type === 'user') WebEngageManager.logout();
    patch({ session: null, cart: [], coupon: null });
  };

  const updateProfile: AppContextValue['updateProfile'] = (p, customAttributes) => {
    if (state.session?.type !== 'user') return;
    const userId = state.session.userId;
    const before = state.accounts.find((a) => a.id === userId);
    if (before) {
      const { password: _password, ...current } = before;
      const next = { ...current, ...p };
      const changed = (Object.keys(p) as (keyof typeof p)[]).filter((k) => p[k] !== current[k]);
      syncUser(next, customAttributes);
      if (current.city && !next.city) WebEngageManager.deleteAttribute('City');
      track('Profile Updated', { 'Updated Fields': changed.map(String) }, customAttributes);
    }
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
    track(
      'Added To Cart',
      { ...productProps(product), Quantity: qty, ...(opts.size ? { Size: opts.size } : {}), ...(opts.color ? { Color: opts.color } : {}) },
      opts.extra,
    );
  };

  const trackRemoved = (item: CartItem | undefined) => {
    const product = item && getProduct(item.productId);
    if (!item || !product) return;
    track('Removed From Cart', {
      ...productProps(product),
      Quantity: item.qty,
      ...(item.size ? { Size: item.size } : {}),
      ...(item.color ? { Color: item.color } : {}),
    });
  };

  const updateQty: AppContextValue['updateQty'] = (key, qty) => {
    if (qty <= 0) trackRemoved(state.cart.find((i) => i.key === key));
    patch((s) => ({
      cart: qty <= 0 ? s.cart.filter((i) => i.key !== key) : s.cart.map((i) => (i.key === key ? { ...i, qty } : i)),
    }));
  };

  const removeFromCart: AppContextValue['removeFromCart'] = (key) => {
    trackRemoved(state.cart.find((i) => i.key === key));
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
    track('Coupon Applied', { 'Coupon Code': c, 'Cart Value': subtotal, Currency: CURRENCY });
    return { ok: true, message: `${c} applied (${def.label}).` };
  };

  const removeCoupon = () => {
    if (state.coupon) track('Coupon Removed', { 'Coupon Code': state.coupon });
    patch({ coupon: null });
  };

  const toggleWishlist: AppContextValue['toggleWishlist'] = (productId, extra) => {
    const has = state.wishlist.includes(productId);
    patch((s) => ({ wishlist: has ? s.wishlist.filter((id) => id !== productId) : [...s.wishlist, productId] }));
    const product = getProduct(productId);
    if (product) track(has ? 'Removed From Wishlist' : 'Added To Wishlist', productProps(product), extra);
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
    patch((s) => ({ orders: [order, ...s.orders], cart: [], coupon: null }));
    track('Order Placed', orderProps(order), extra);
    return order;
  };

  const saveAddress: AppContextValue['saveAddress'] = (address) => {
    patch((s) => ({ addresses: [...s.addresses, { ...address, id: `a_${uid()}` }] }));
  };

  const removeAddress: AppContextValue['removeAddress'] = (id) => {
    patch((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));
  };

  const setOptIn: AppContextValue['setOptIn'] = (channel, value) => {
    WebEngageManager.instance.user.setOptIn(channel, value);
    track('Notification Preference Changed', { Channel: channel, Enabled: value });
    patch((s) => ({ optIns: { ...s.optIns, [channel]: value } }));
  };

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
