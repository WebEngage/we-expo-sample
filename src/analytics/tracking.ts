import type { Order, Payload, Product, User } from '@/types';

import WebEngageManager from './WebEngageManager';

export const CURRENCY = 'USD';

// Attribute and event property names over 50 characters, or starting with
// `we_`, are silently ignored by WebEngage, so they are skipped here.
const validName = (name: string) => name.length > 0 && name.length < 50 && !name.startsWith('we_');

/** The "Add custom data" rows can carry any name: keep only the ones WebEngage accepts. */
export function usableCustomData(custom?: Payload): Payload {
  const out: Payload = {};
  if (!custom) return out;
  for (const [name, value] of Object.entries(custom)) {
    if (validName(name)) out[name] = value;
  }
  return out;
}

/** Sends the signed-in user's profile. Guests stay anonymous. Standard fields use
 *  their own setters; everything else is a custom attribute. Phone is left out:
 *  the app stores numbers without a country code and WebEngage needs E.164. */
export function syncUser(user: User, custom?: Payload): void {
  if (user.isGuest) return;
  if (user.firstName) WebEngageManager.setFirstName(user.firstName);
  if (user.lastName) WebEngageManager.setLastName(user.lastName);
  if (user.email) WebEngageManager.setEmail(user.email);
  if (user.gender) WebEngageManager.setGender(user.gender.toLowerCase());
  if (/^\d{4}-\d{2}-\d{2}$/.test(user.birthDate)) WebEngageManager.setBirthDate(user.birthDate);
  if (user.city) WebEngageManager.setAttribute('City', user.city);
  const extra = usableCustomData(custom);
  for (const [name, value] of Object.entries(extra)) WebEngageManager.setAttribute(name, value);
}

/** Events carry the app's own typed data too; standard properties win a name clash. */
export function track(name: string, standard: Record<string, any> = {}, custom?: Payload): void {
  WebEngageManager.trackEvent(name, { ...usableCustomData(custom), ...standard });
}

export const productProps = (p: Product) => ({
  'Product ID': p.id,
  'Product Name': p.name,
  Brand: p.brand,
  Category: p.category,
  Price: p.price,
  Currency: CURRENCY,
});

export const orderProps = (o: Order) => ({
  'Order ID': o.id,
  Amount: o.total,
  Subtotal: o.subtotal,
  Discount: o.discount,
  Shipping: o.shipping,
  'Item Count': o.items.reduce((n, i) => n + i.qty, 0),
  ...(o.coupon ? { 'Coupon Code': o.coupon } : {}),
  'Payment Method': o.paymentMethod,
  Currency: CURRENCY,
  Products: o.items.map((i) => ({
    'Product ID': i.productId,
    'Product Name': i.name,
    Price: i.price,
    Quantity: i.qty,
    ...(i.size ? { Size: i.size } : {}),
    ...(i.color ? { Color: i.color } : {}),
  })),
});
