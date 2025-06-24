
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAllMemberAttributes } from '@dom/memberDataAttributes';
import { logger } from '@utils/logger';
import type { MembershipsMap } from '@/config';

// Mock dependencies
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

vi.mock('@utils/sessions', () => ({
    getCurrentMemberV2: vi.fn(),
    isMemberAuthV2: vi.fn(() => true)
}));

import { getCurrentMemberV2, isMemberAuthV2 } from '@utils/sessions';

// Simple test data
const mockMemberData: any = {
    id: 'mem_123',
    email: 'test@example.com',
    planConnections: [{
        planId: 'pln_premium',
        status: 'active',
        payment: { amount: 2999, currency: 'USD' }
    }]
};

const mockImportedMemberships: MembershipsMap[] = [
    { name: 'Premium Plan', oldId: 'mem_old_prem', newId: 'pln_premium' },
    { name: 'Basic Plan', oldId: 'mem_old_basic', newId: 'pln_basic' }
];

describe('memberDataAttributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCurrentMemberV2).mockReturnValue(mockMemberData);
        vi.mocked(isMemberAuthV2).mockReturnValue(true);
        document.body.innerHTML = '';
    });

    describe('updateAllMemberAttributes - functionality', () => {
        it('should replace membership.name with name from imported memberships', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Premium Plan');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with membership-related data-ms-member attributes');
        });

        it('should replace membership.name with space when no mapping found', () => {
            const unmappedMemberData = {
                ...mockMemberData,
                planConnections: [{
                    planId: 'pln_unknown',
                    status: 'active',
                    payment: { amount: 1999, currency: 'USD' }
                }]
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(unmappedMemberData);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe(' ');
        });

        it('should replace membership.amount with payment amount', () => {
            document.body.innerHTML = `
                <div data-ms-member="membership.amount">$0</div>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe('2999');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with membership-related data-ms-member attributes');
        });

        it('should replace membership.amount with space when no payment amount', () => {
            const memberDataNoAmount = {
                ...mockMemberData,
                planConnections: [{
                    planId: 'pln_premium',
                    status: 'active',
                    payment: null
                }]
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(memberDataNoAmount);

            document.body.innerHTML = `
                <div data-ms-member="membership.amount">$0</div>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe(' ');
        });

        it('should replace membership.status with plan status', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.status">unknown</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.status"]')?.textContent).toBe('active');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with membership-related data-ms-member attributes');
        });

        it('should replace all membership attributes correctly', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
                <div data-ms-member="membership.amount">$0</div>
                <p data-ms-member="membership.status">unknown</p>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(3);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Premium Plan');
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe('2999');
            expect(document.querySelector('[data-ms-member="membership.status"]')?.textContent).toBe('active');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with membership-related data-ms-member attributes');
        });

        it('should ignore non-membership attributes', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
                <div data-ms-member="profile.name">Should not change</div>
                <p data-ms-member="membership.status">unknown</p>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(2);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Premium Plan');
            expect(document.querySelector('[data-ms-member="profile.name"]')?.textContent).toBe('Should not change');
            expect(document.querySelector('[data-ms-member="membership.status"]')?.textContent).toBe('active');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 2 elements with membership-related data-ms-member attributes');
        });

        it('should handle unknown property paths', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.unknown">Should not change</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="membership.unknown"]')?.textContent).toBe('Should not change');
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] Unknown property path: membership.unknown');
        });

        it('should handle empty imported memberships array', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes([]);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe(' ');
        });

        it('should return 0 when not authenticated', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(false);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Loading...');
        });

        it('should return 0 when member data is null', () => {
            vi.mocked(getCurrentMemberV2).mockReturnValue(null);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] Failed to fetch member data');
        });

        it('should return 0 when no plan connections exist', () => {
            const memberDataNoPlan = {
                ...mockMemberData,
                planConnections: []
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(memberDataNoPlan);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] No plan connections found in member data');
        });

        it('should insert blank when amount is null or zero', () => {
            // Mock member with no payment amount
            const memberDataNoPayment = {
                ...mockMemberData,
                planConnections: [{
                    planId: 'pln_premium',
                    status: 'active',
                    payment: { amount: null, currency: 'USD' }
                }]
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(memberDataNoPayment);

            document.body.innerHTML = `
                <div data-ms-member="membership.amount">Original Content</div>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);
            expect(result).toBe(1); // Should not count as updated since value was empty
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe(' ');
        });
    });
});