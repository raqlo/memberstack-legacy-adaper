import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldUseAdapter } from './detect-ms-version';
import type { AdapterConfig } from '../config';
import { LOCAL_SESSION_NAME } from '../utils/enums';

// Mock browser APIs
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

// Setup global mocks
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

describe('shouldUseAdapter', () => {
    let testConfig: AdapterConfig;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.search = '';
        mockLocation.pathname = '/test-path';

        // Use a real config structure
        testConfig = {
            adapter: {
                enabled: true,
                importedMemberships: {'old-plan-id': 'new-plan-id', 'old-price-id': 'new-price-id', 'old-membership-id': 'new-membership-id'},
            },
            appIdV1: 'test-app-id-v1',
            publicKey: 'test-public-key',
            appId: 'test-app-id-v2',
            debug: true
        };
    });

    describe('when adapter is already in session storage', () => {
        it('should return v2 when session storage has "true"', () => {
            mockSessionStorage.getItem.mockReturnValue('true');
            mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mockSessionStorage.getItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME);
        });

        it('should return v2 even when query param is also present', () => {
            mockSessionStorage.getItem.mockReturnValue('true');
            mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mockSessionStorage.getItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME);
        });
    });

    describe('when adapter query parameter is present', () => {
        it('should return v2 and set session storage when adapter=true', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });

        it('should return v2 when adapter=v2', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
        });

        it('should return v1 when adapter=v1', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });

        it('should return v1 when adapter=false', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=false';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });

        it('should handle multiple query parameters correctly', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true&other=value&foo=bar';

            shouldUseAdapter(testConfig);

            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path?other=value&foo=bar');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
        });
    });

    describe('when forcedVersion is configured', () => {
        it('should return v2 when forcedVersion is v2', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '';
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
        });

        it('should return v1 when forcedVersion is v1', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '';
            testConfig.adapter.forcedVersion = 'v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should prefer query param over forcedVersion', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=v1';
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('when no adapter indicators are present', () => {
        it('should return v1 when no query params, no session storage, and no forcedVersion', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
        });

        it('should return v1 when session storage is empty string', () => {
            mockSessionStorage.getItem.mockReturnValue('');
            mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should return v1 when session storage has false', () => {
            mockSessionStorage.getItem.mockReturnValue('false');
            mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('config properties preservation', () => {
        it('should set currentVersion on existing adapter object', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            // Verify other properties are preserved
            expect(testConfig.adapter.enabled).toBe(true);
            expect(testConfig.adapter.importedMemberships).toEqual({'old-plan-id': 'new-plan-id', 'old-price-id': 'new-price-id', 'old-membership-id': 'new-membership-id'});
        });

        it('should preserve existing adapter properties when setting currentVersion', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '';
            testConfig.adapter = {
                enabled: false,
                forcedVersion: 'v2',
                importedMemberships: { test: 'value' }
            };

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(testConfig.adapter.enabled).toBe(false);
            expect(testConfig.adapter.forcedVersion).toBe('v2');
            expect(testConfig.adapter.importedMemberships).toEqual({ test: 'value' });
        });
    });

    describe('edge cases', () => {
        it('should handle empty query string', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle malformed query parameters', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle URL-encoded query parameters', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true&redirect=%2Fhome';

            shouldUseAdapter(testConfig);

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path?redirect=%2Fhome');
        });
    });

    describe('integration scenarios', () => {
        it('should work correctly across multiple calls (session persistence)', () => {
            // First call - no session, query param present
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true';

            const firstResult = shouldUseAdapter(testConfig);
            expect(firstResult).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');

            // Reset mocks for the second call
            vi.clearAllMocks();
            const secondConfig: AdapterConfig = {
                adapter: {
                    enabled: true,
                    importedMemberships: {},
                },
                appIdV1: 'test-app-id-v1',
                publicKey: 'test-public-key',
                appId: 'test-app-id-v2',
                debug: true
            };

            // Second call - session exists, no query param
            mockSessionStorage.getItem.mockReturnValue('true');
            mockLocation.search = '';

            const secondResult = shouldUseAdapter(secondConfig);
            expect(secondResult).toBe('v2');
            expect(secondConfig.adapter.currentVersion).toBe('v2');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
        });
    });
});