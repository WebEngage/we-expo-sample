import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type WebEngage from 'react-native-webengage';

// --- Safety guard ---------------------------------------------------------
// WebEngage must never break the app: every SDK call and every handler passed
// to it runs inside try/catch, and on web or in Expo Go — where the native
// module doesn't exist — every call is a silent no-op. Failures are logged in
// development builds only, and never with user data.
const warn = (where: string, error: unknown): void => {
  if (__DEV__) console.warn(`[WebEngage] ${where} failed:`, error);
};

/** True where WebEngage's native module can exist (not web, not Expo Go). */
export const webengageAvailable: boolean =
  Platform.OS !== 'web' && !isRunningInExpoGo();

// A stand-in that accepts any property access or call and does nothing.
// (`then` is undefined so awaiting or returning the handle can never hang.)
const NOOP: any = new Proxy(function () {}, {
  get: (_target, prop) => (prop === 'then' ? undefined : NOOP),
  apply: () => undefined,
});

/** Wraps any function arguments (listeners, handlers) so an error inside one
 *  can't escape through the SDK. */
export function guardArgs<T extends unknown[]>(where: string, args: T): T {
  return args.map((arg) =>
    typeof arg === 'function'
      ? (...cbArgs: unknown[]) => {
          try {
            return (arg as (...a: unknown[]) => unknown)(...cbArgs);
          } catch (e) {
            warn(`${where} handler`, e);
          }
        }
      : arg
  ) as T;
}

function guarded(target: any, path: string): any {
  if (target == null) return NOOP;
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop);
      const where = `${path}.${String(prop)}`;
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          try {
            const result = value.apply(obj, guardArgs(where, args));
            return result && typeof result.catch === 'function'
              ? result.catch((e: unknown) => warn(where, e))
              : result;
          } catch (e) {
            warn(where, e);
          }
        };
      }
      return value && typeof value === 'object' ? guarded(value, where) : value;
    },
  });
}

/** A new guarded SDK handle — never throws, a silent no-op where unavailable.
 *  The wrapper holds one; the Android background push task builds its own
 *  inside the task body. */
export function createGuardedWebEngage(): WebEngage {
  if (!webengageAvailable) return NOOP;
  try {
    // Required lazily so importing this file can never throw where the
    // native module is missing.
    const Sdk = require('react-native-webengage').default;
    return guarded(new Sdk(), 'webengage');
  } catch (e) {
    warn('create', e);
    return NOOP;
  }
}

/** Runs a call on an optional feature package (In-Line, Inbox) under the
 *  same contract: the fallback when unavailable, thrown, or rejected. */
export async function safeCall<T>(
  where: string,
  fn: () => T | Promise<T>,
  fallback: T
): Promise<T> {
  if (!webengageAvailable) return fallback;
  try {
    return await fn();
  } catch (e) {
    warn(where, e);
    return fallback;
  }
}

// --- The wrapper ------------------------------------------------------------
class WebEngageManagerClass {
  private webengage = createGuardedWebEngage();

  // The same guarded handle, for one-shot SDK calls that deliberately stay
  // outside this class (opt-in and permission calls made at a specific site).
  get instance() {
    return this.webengage;
  }

  init(): void {
    this.webengage.initialize();
  }
}

const WebEngageManager = new WebEngageManagerClass();
export default WebEngageManager;
