
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldUseAdapter } from '@/loader/detect-ms-version';
import { createTestConfig, mockBrowserAPIs } from '../../helpers/test-utils';
import { LOCAL_SESSION_NAME } from '@utils/enums';
import type {AdapterConfig} from "@/config";

describe('shouldUseAdapter', () => {
    let testConfig: AdapterConfig;
    let mockSessionStorage: any;
    let mockHistory: any;
    let mockLocation: any;

    beforeEach(() => {
        vi.clearAllMocks();

        const mocks = mockBrowserAPIs();
        ({ mockSessionStorage, mockHistory, mockLocation } = mocks);

        testConfig = createTestConfig();
        mockLocation.search = '';
        mockLocation.pathname = '/test-path';
    });

    describe('when query parameter is present', () => {
        it('should return v2 and store v2 when query param is "v2"', () => {
            mockLocation.search = '?adapter=v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v2');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(testConfig.adapter.currentVersion).toBe('v2');
        });

        it('should return v2 and store v2 when query param is "true"', () => {
            mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v2');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(testConfig.adapter.currentVersion).toBe('v2');
        });

        it('should return v1 and store v1 when query param is "v1"', () => {
            mockLocation.search = '?adapter=v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v1');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should return v1 and store v1 when query param is "false"', () => {
            mockLocation.search = '?adapter=false';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v1');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should return v1 and store v1 when query param is any other value', () => {
            mockLocation.search = '?adapter=unknown';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v1');
            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should preserve other query parameters when cleaning up adapter param', () => {
            mockLocation.search = '?adapter=v2&other=value&test=123';

            shouldUseAdapter(testConfig);

            expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path?other=value&test=123');
        });

        it('should override session storage when query parameter is present', () => {
            mockLocation.search = '?adapter=v1';
            mockSessionStorage.getItem.mockReturnValue('v2');

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('when session storage has a value', () => {
        it('should return v2 when session storage has "v2"', () => {
            mockSessionStorage.getItem.mockReturnValue('v2');

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(testConfig.adapter.currentVersion).toBe('v2');
        });

        it('should return v1 when session storage has "v1"', () => {
            mockSessionStorage.getItem.mockReturnValue('v1');

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should ignore invalid session storage values and use default', () => {
            mockSessionStorage.getItem.mockReturnValue('invalid');

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should ignore legacy "true" session storage value and use default', () => {
            mockSessionStorage.getItem.mockReturnValue('true');

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('when config has forcedVersion', () => {
        it('should return v2 when config.adapter.forcedVersion is "v2"', () => {
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(testConfig.adapter.currentVersion).toBe('v2');
        });

        it('should return v1 when config.adapter.forcedVersion is "v1"', () => {
            testConfig.adapter.forcedVersion = 'v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should be overridden by query parameter', () => {
            mockLocation.search = '?adapter=v1';
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should be overridden by valid session storage', () => {
            mockSessionStorage.getItem.mockReturnValue('v1');
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('default behavior', () => {
        it('should return v1 when no query param, session storage, or forced version', () => {
            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mockHistory.replaceState).not.toHaveBeenCalled();
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('precedence order', () => {
        it('should prioritize query parameter over session storage', () => {
            mockLocation.search = '?adapter=v2';
            mockSessionStorage.getItem.mockReturnValue('v1');

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v2');
        });

        it('should prioritize query parameter over forced version', () => {
            mockLocation.search = '?adapter=v1';
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'v1');
        });

        it('should prioritize session storage over forced version', () => {
            mockSessionStorage.getItem.mockReturnValue('v2');
            testConfig.adapter.forcedVersion = 'v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
        });
    });
});