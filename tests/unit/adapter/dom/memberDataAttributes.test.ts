
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAllMemberAttributes } from '@dom/memberDataAttributes';
import { logger } from '@utils/logger';

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

describe('memberDataAttributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCurrentMemberV2).mockReturnValue(mockMemberData);
        vi.mocked(isMemberAuthV2).mockReturnValue(true);
        document.body.innerHTML = '';
    });

    describe('updateAllMemberAttributes - functionality', () => {
        it('should replace membership.name with planId', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('pln_premium');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with membership-related data-ms-member attributes');
        });

        it('should replace membership.amount with payment amount', () => {
            document.body.innerHTML = `
                <div data-ms-member="membership.amount">$0</div>
            `;

            const result = updateAllMemberAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe('2999');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with membership-related data-ms-member attributes');
        });

        it('should replace membership.status with plan status', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.status">unknown</span>
            `;

            const result = updateAllMemberAttributes();

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

            const result = updateAllMemberAttributes();

            expect(result).toBe(3);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('pln_premium');
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

            const result = updateAllMemberAttributes();

            expect(result).toBe(2);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('pln_premium');
            expect(document.querySelector('[data-ms-member="profile.name"]')?.textContent).toBe('Should not change');
            expect(document.querySelector('[data-ms-member="membership.status"]')?.textContent).toBe('active');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 2 elements with membership-related data-ms-member attributes');
        });

        it('should return 0 when not authenticated', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(false);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes();

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Loading...');
        });

        it('should not warn when member data is null', () => {
            vi.mocked(getCurrentMemberV2).mockReturnValue(null);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
            `;

            const result = updateAllMemberAttributes();

            expect(result).toBe(0);
            expect(logger).not.toHaveBeenCalledWith('warn');
        });
    });
});