import type { AdapterConfig } from '../../config';
import { vi } from 'vitest';

export function createTestConfig(overrides: Partial<AdapterConfig> = {}): AdapterConfig {
    return {
        adapter: {
            enabled: true,
            importedMemberships: {'old-plan-id': 'new-plan-id', 'old-price-id': 'new-price-id', 'old-membership-id': 'new-membership-id'},
            ...overrides.adapter
        },
        appIdV1: 'test-app-id-v1',
        publicKey: 'test-public-key',
        appId: 'test-app-id-v2',
        debug: true,
        ...overrides
    };
}

export function mockBrowserAPIs() {
    const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
    };

    const mockHistory = {
        replaceState: vi.fn()
    };

    const mockLocation = {
        search: '',
        pathname: '/test-path'
    };

    Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true
    });

    Object.defineProperty(window, 'history', {
        value: mockHistory,
        writable: true
    });

    Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
    });

    return { mockSessionStorage, mockHistory, mockLocation };
}