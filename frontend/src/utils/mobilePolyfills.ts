import { Alert } from 'react-native';

// Safe event listeners dictionary
const eventListeners: Record<string, Function[]> = {};

// 1. Ensure `window` exists
const win: any = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});

// 2. Safe Event class polyfill
if (typeof (global as any).Event === 'undefined' || typeof (global as any).Event !== 'function') {
  (global as any).Event = class CustomEventPolyfill {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}
if (typeof win.Event === 'undefined' || typeof win.Event !== 'function') {
  win.Event = (global as any).Event;
}

// 3. Safe addEventListener polyfill
if (typeof win.addEventListener !== 'function') {
  win.addEventListener = (type: string, listener: Function) => {
    if (typeof listener !== 'function') return;
    if (!eventListeners[type]) {
      eventListeners[type] = [];
    }
    eventListeners[type].push(listener);
  };
}

// 4. Safe removeEventListener polyfill
if (typeof win.removeEventListener !== 'function') {
  win.removeEventListener = (type: string, listener: Function) => {
    if (!eventListeners[type]) return;
    eventListeners[type] = eventListeners[type].filter(fn => fn !== listener);
  };
}

// 5. Safe dispatchEvent polyfill
if (typeof win.dispatchEvent !== 'function') {
  win.dispatchEvent = (event: any) => {
    const type = typeof event === 'string' ? event : event?.type;
    if (type && eventListeners[type]) {
      eventListeners[type].forEach(fn => {
        try {
          fn(event);
        } catch (e) {
          console.warn('[EventPolyfill] Error in listener for ' + type, e);
        }
      });
    }
    return true;
  };
}

// 6. Safe localStorage polyfill (In-memory mobile store)
if (!win.localStorage) {
  const store: Record<string, string> = {};
  win.localStorage = {
    getItem: (key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      Object.keys(store).forEach(k => delete store[k]);
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(store).length;
    }
  };
}

// 7. Safe alert polyfill
if (typeof win.alert !== 'function') {
  win.alert = (message: any) => {
    Alert.alert('WordBoost', String(message));
  };
}

export {};
