import { getProduct } from '@/data/products';
import type { CartItem, Order } from '@/types';

import { CURRENCY } from './tracking';

const SCREEN_NAMES: Record<string, string> = {
  welcome: 'Welcome',
  login: 'Login',
  signup: 'Sign Up',
  // Lower case: the dashboard's In-Line and In-App rules for Home match `home` exactly.
  '(tabs)': 'home',
  '(tabs)/search': 'Search',
  '(tabs)/cart': 'Cart',
  '(tabs)/account': 'Account',
  '(tabs)/test-lab': 'Test Lab',
  'product/[id]': 'Product Details',
  'category/[slug]': 'Category',
  checkout: 'Checkout',
  'order-confirmation/[id]': 'Order Confirmation',
  orders: 'My Orders',
  'orders/[id]': 'Order Details',
  wishlist: 'Wishlist',
  addresses: 'Saved Addresses',
  'profile-edit': 'Edit Profile',
  'notification-settings': 'Notification Settings',
  inbox: 'Notifications',
  // Dashboard In-Line test screens; the names are the ones their page rules match.
  'inline/screen1': 'screen1',
  'inline/screen3': 'screen3',
  'inline/screen4': 'screen4',
};

/** Screens shown only while signed out. */
export const SIGNED_OUT_SCREENS = ['Welcome', 'Login', 'Sign Up'];

/** The dashboard's name for a route, from Expo Router's route pattern. */
export function screenNameFor(segments: string[], pathname: string): string | null {
  const key = segments.join('/');
  return SCREEN_NAMES[key] ?? (key ? key : pathname || null);
}

export interface ScreenContext {
  cart: CartItem[];
  cartTotal: number;
  coupon: string | null;
  isGuest: boolean;
  orders: Order[];
}

/** Screen Data for targeting and personalization. Never personal data; it is
 *  re-declared on every navigation because each screen() call replaces the last. */
export function screenDataFor(name: string, pathname: string, ctx: ScreenContext): Record<string, any> {
  const itemCount = ctx.cart.reduce((n, i) => n + i.qty, 0);
  const id = pathname.split('/')[2];
  switch (name) {
    case 'home':
      return { 'Is Guest': ctx.isGuest, 'Cart Item Count': itemCount };
    case 'Cart':
      return { 'Cart Value': ctx.cartTotal, 'Item Count': itemCount, 'Coupon Applied': ctx.coupon !== null, Currency: CURRENCY };
    case 'Checkout':
      return { 'Cart Value': ctx.cartTotal, 'Item Count': itemCount, Currency: CURRENCY };
    case 'Product Details': {
      const p = id ? getProduct(id) : undefined;
      return p ? { 'Product ID': p.id, 'Product Category': p.category, Price: p.price } : {};
    }
    case 'Category':
      return id ? { Category: id } : {};
    case 'Order Confirmation': {
      const o = ctx.orders.find((x) => x.id === id);
      return o ? { 'Order ID': o.id, 'Order Value': o.total } : {};
    }
    default:
      return {};
  }
}
