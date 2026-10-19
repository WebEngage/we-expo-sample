import React from 'react';

import { guardArgs, safeCall, webengageAvailable } from './WebEngageManager';

type Pkg = typeof import('react-native-we-personalization');

// Required lazily so importing this file never throws where the native module
// is missing (web, Expo Go).
let pkg: Pkg | null = null;
if (webengageAvailable) {
  try {
    pkg = require('react-native-we-personalization');
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] personalization package unavailable:', e);
  }
}

// Renders nothing where the package isn't available, and nothing if the native
// view is missing (JS updated, app not rebuilt): an error boundary catches the
// render error that safeCall cannot, because it happens inside React.
class WidgetBoundary extends React.Component<{ children?: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
const PkgWidget = pkg?.WEInlineWidget as any;
export const WEInlineWidget = ((props: any) =>
  PkgWidget ? React.createElement(WidgetBoundary, null, React.createElement(PkgWidget, props)) : null
) as Pkg['WEInlineWidget'];

// Fire-and-forget: errors are caught and shown in development only.
const run = (where: string, fn: (p: Pkg) => unknown): void => {
  void safeCall(where, () => (pkg ? fn(pkg) : undefined), undefined);
};

export const initWePersonalization = () => run('personalization.init', (p) => p.initWePersonalization());
export const enableDevMode = () => run('personalization.devMode', (p) => p.enableDevMode());
export const registerWEPlaceholderCallback = (...args: any[]) =>
  run('personalization.register', (p) =>
    (p.registerWEPlaceholderCallback as any)(...guardArgs('personalization.register', args))
  );
export const deregisterWEPlaceholderCallback = (...args: any[]) =>
  run('personalization.deregister', (p) => (p.deregisterWEPlaceholderCallback as any)(...args));
export const trackImpression = (...args: any[]) =>
  run('personalization.impression', (p) => (p.trackImpression as any)(...args));
export const trackClick = (...args: any[]) =>
  run('personalization.click', (p) => (p.trackClick as any)(...args));
