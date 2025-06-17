import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { shouldUseAdapter } from './detect-ms-version';
import type { AdapterConfig } from '../config';
import { LOCAL_SESSION_NAME } from '../utils/enums';
import { logger } from '../utils/logger';

// Mock the logger
vi.mock('../utils/logger', () => ({
    logger: vi.fn()
}));

const mockLogger = logger as MockedFunction<typeof logger>;

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
    const mockConfig: AdapterConfig = {} as AdapterConfig;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.search = '';
        mockLocation.pathname = '/test-path';
    });

    describe('when adapter is already in session storage', () => {
        it('should return v2 when session storage has "true"', () => {
            mockSessionStorage.getItem.mockReturnValue('true');
            mockLocation.search = '';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.getItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME);
        });

        it('should return v2 even when query param is also present', () => {
            mockSessionStorage.getItem.mockReturnValue('true');
            mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.getItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME);
            // Should not process query params since session storage takes precedence
        });
    });

    describe('when adapter query parameter is present', () => {
        it('should set session storage and clean up query params when adapter=true', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(mockConfig);

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(mockLogger).toHaveBeenCalledWith(
                'info',
                '[Adapter] Adapter found. Setting session storage and cleaning up query params.'
            );
            expect(result).toBe('v1'); // Returns v1 on the first call, v2 on later calls
        });

        it('should handle multiple query parameters correctly', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true&other=value&foo=bar';

            shouldUseAdapter(mockConfig);

            // Should only remove the adapter parameter
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
        });

        it('should not set session storage when adapter=false', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=false';

            const result = shouldUseAdapter(mockConfig);

            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(mockLogger).not.toHaveBeenCalled();
            expect(result).toBe('v1');
        });

        it('should not set session storage when adapter has other values', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=maybe';

            const result = shouldUseAdapter(mockConfig);

            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(mockLogger).not.toHaveBeenCalled();
            expect(result).toBe('v1');
        });
    });

    describe('when no adapter indicators are present', () => {
        it('should return v1 when no query params and no session storage', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(mockLogger).not.toHaveBeenCalled();
        });

        it('should return v1 when session storage is empty string', () => {
            mockSessionStorage.getItem.mockReturnValue('');
            mockLocation.search = '';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v1');
        });

        it('should return v1 when session storage has false', () => {
            mockSessionStorage.getItem.mockReturnValue('false');
            mockLocation.search = '';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v1');
        });
    });

    describe('edge cases', () => {
        it('should handle empty query string', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle malformed query parameters', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter';

            const result = shouldUseAdapter(mockConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle URL-encoded query parameters', () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true&redirect=%2home';

            shouldUseAdapter(mockConfig);

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });
    });

    describe('integration scenarios', () => {
        it('should work correctly across multiple calls (session persistence)', () => {
            // First call - no session, query param present
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocation.search = '?adapter=true';

            const firstResult = shouldUseAdapter(mockConfig);
            expect(firstResult).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');

            // Reset mocks for the second call
            vi.clearAllMocks();

            // Second call - session exists, no query param
            mockSessionStorage.getItem.mockReturnValue('true');
            mockLocation.search = '';

            const secondResult = shouldUseAdapter(mockConfig);
            expect(secondResult).toBe('v2');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
        });
    });
});