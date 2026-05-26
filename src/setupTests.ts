import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch globally - returns 404 by default, can be overridden per test
globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
  const urlString = typeof input === 'string' ? input : input.toString();
  console.warn(`Unmocked fetch call: ${urlString}`);
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'Not mocked' }), { status: 404 })
  );
}) as typeof fetch;

// Suppress console logs during tests
const originalConsole = global.console;
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
};

// Restore console.warn for debugging
global.console.warn = originalConsole.warn;

