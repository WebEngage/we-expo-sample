export type AttrType = 'string' | 'number' | 'boolean' | 'date' | 'array';

/** One row in the "Add custom data" editor. `value` is always the raw text; booleans are 'true' / 'false'. */
export interface CustomAttr {
  id: string;
  name: string;
  type: AttrType;
  value: string;
}

/** Typed key/value data built from the custom data rows. */
export type Payload = Record<string, string | number | boolean | Date | string[]>;

export type CategorySlug = 'footwear' | 'clothing' | 'electronics' | 'accessories' | 'home';

export interface Category {
  slug: CategorySlug;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategorySlug;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem {
  key: string;
  productId: string;
  qty: number;
  size?: string;
  color?: string;
  extra?: Payload;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  city: string;
  pincode: string;
  phone: string;
}

export type PaymentMethod = 'Card' | 'UPI' | 'Wallet' | 'Cash on Delivery';

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: string | null;
  paymentMethod: PaymentMethod;
  address: Address;
  status: 'Placed' | 'Shipped' | 'Delivered';
  extra?: Payload;
}

export interface User {
  id: string;
  isGuest: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: '' | 'Male' | 'Female' | 'Other';
  birthDate: string;
  city: string;
  customAttributes: Payload;
}

export interface Account extends User {
  password: string;
}

export interface OptIns {
  push: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}
