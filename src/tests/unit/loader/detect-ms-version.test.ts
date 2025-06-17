import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldUseAdapter } from '../../../loader/detect-ms-version';
import type { AdapterConfig } from '../../../config';
import { LOCAL_SESSION_NAME } from '../../../utils/enums';
import {createTestConfig, mockBrowserAPIs} from "../../helpers/test-utils";

describe('shouldUseAdapter', () => {
    let testConfig: AdapterConfig;
    let mocks: ReturnType<typeof mockBrowserAPIs>;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks = mockBrowserAPIs();
        testConfig = createTestConfig();

        mocks.mockLocation.search = '';
        mocks.mockLocation.pathname = '/test-path';


    });

    describe('when adapter is already in session storage', () => {
        it('should return v2 when session storage has "true"', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue('true');
            mocks.mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mocks.mockSessionStorage.getItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME);
        });

        it('should return v2 even when query param is also present', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue('true');
            mocks.mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mocks.mockSessionStorage.getItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME);
        });
    });

    describe('when adapter query parameter is present', () => {
        it('should return v2 and set session storage when adapter=true', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=true';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mocks.mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
            expect(mocks.mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });

        it('should return v2 when adapter=v2', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mocks.mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
        });

        it('should return v1 when adapter=v1', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mocks.mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mocks.mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });

        it('should return v1 when adapter=false', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=false';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mocks.mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mocks.mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path');
        });

        it('should handle multiple query parameters correctly', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=true&other=value&foo=bar';

            shouldUseAdapter(testConfig);

            expect(mocks.mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path?other=value&foo=bar');
            expect(mocks.mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
        });
    });

    describe('when forcedVersion is configured', () => {
        it('should return v2 when forcedVersion is v2', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '';
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
        });

        it('should return v1 when forcedVersion is v1', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '';
            testConfig.adapter.forcedVersion = 'v1';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should prefer query param over forcedVersion', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=v1';
            testConfig.adapter.forcedVersion = 'v2';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('when no adapter indicators are present', () => {
        it('should return v1 when no query params, no session storage, and no forcedVersion', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mocks.mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mocks.mockHistory.replaceState).not.toHaveBeenCalled();
        });

        it('should return v1 when session storage is empty string', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue('');
            mocks.mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });

        it('should return v1 when session storage has false', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue('false');
            mocks.mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
        });
    });

    describe('config properties preservation', () => {
        it('should set currentVersion on existing adapter object', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            // Verify other properties are preserved
            expect(testConfig.adapter.enabled).toBe(true);
            expect(testConfig.adapter.importedMemberships).toEqual({'old-plan-id': 'new-plan-id', 'old-price-id': 'new-price-id', 'old-membership-id': 'new-membership-id'});
        });

        it('should preserve existing adapter properties when setting currentVersion', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '';
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
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mocks.mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle malformed query parameters', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter';

            const result = shouldUseAdapter(testConfig);

            expect(result).toBe('v1');
            expect(testConfig.adapter.currentVersion).toBe('v1');
            expect(mocks.mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle URL-encoded query parameters', () => {
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=true&redirect=%2Fhome';

            shouldUseAdapter(testConfig);

            expect(mocks.mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');
            expect(mocks.mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test-path?redirect=%2Fhome');
        });
    });

    describe('integration scenarios', () => {
        it('should work correctly across multiple calls (session persistence)', () => {
            // First call - no session, query param present
            mocks.mockSessionStorage.getItem.mockReturnValue(null);
            mocks.mockLocation.search = '?adapter=true';

            const firstResult = shouldUseAdapter(testConfig);
            expect(firstResult).toBe('v2');
            expect(testConfig.adapter.currentVersion).toBe('v2');
            expect(mocks.mockSessionStorage.setItem).toHaveBeenCalledWith(LOCAL_SESSION_NAME, 'true');

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
            mocks.mockSessionStorage.getItem.mockReturnValue('true');
            mocks.mockLocation.search = '';

            const secondResult = shouldUseAdapter(secondConfig);
            expect(secondResult).toBe('v2');
            expect(secondConfig.adapter.currentVersion).toBe('v2');
            expect(mocks.mockSessionStorage.setItem).not.toHaveBeenCalled();
            expect(mocks.mockHistory.replaceState).not.toHaveBeenCalled();
        });
    });
});