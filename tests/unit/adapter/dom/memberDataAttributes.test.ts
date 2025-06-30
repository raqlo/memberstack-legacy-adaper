
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
    createdAt: '2024-01-15T14:30:00Z',
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

describe('Member data-ms-member attributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCurrentMemberV2).mockReturnValue(mockMemberData);
        vi.mocked(isMemberAuthV2).mockReturnValue(true);
        document.body.innerHTML = '';
    });

    describe('membership.* attributes', () => {
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

        it('should insert blank when amount is null or zero', () => {
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
            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe(' ');
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
    });

    describe('signup-date.DateTimeFormat() attribute', () => {
        it('should replace signup-date.DateTimeFormat() with formatted date', () => {
            document.body.innerHTML = `
                <span data-ms-member="signup-date.DateTimeFormat()">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('1/15/2024');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with signup-date.DateTimeFormat() attributes');
        });

        it('should handle multiple signup-date elements', () => {
            document.body.innerHTML = `
                <span data-ms-member="signup-date.DateTimeFormat()" class="date1">Loading...</span>
                <div data-ms-member="signup-date.DateTimeFormat()" id="signup-date">Loading...</div>
                <p data-ms-member="signup-date.DateTimeFormat()">Loading...</p>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(3);

            const dateElements = document.querySelectorAll('[data-ms-member="signup-date.DateTimeFormat()"]');
            dateElements.forEach(el => {
                expect(el.textContent).toBe('1/15/2024');
            });

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with signup-date.DateTimeFormat() attributes');
        });

        it('should handle missing createdAt field', () => {
            const memberDataNoDate = {
                ...mockMemberData,
                createdAt: undefined
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(memberDataNoDate);

            document.body.innerHTML = `
                <span data-ms-member="signup-date.DateTimeFormat()">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('Loading...');
        });

        it('should handle invalid date format', () => {
            const memberDataInvalidDate = {
                ...mockMemberData,
                createdAt: 'invalid-date'
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(memberDataInvalidDate);

            document.body.innerHTML = `
                <span data-ms-member="signup-date.DateTimeFormat()">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('Loading...');
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] Invalid signup date: invalid-date');
        });

        it('should handle null createdAt field', () => {
            const memberDataNullDate = {
                ...mockMemberData,
                createdAt: null
            };
            vi.mocked(getCurrentMemberV2).mockReturnValue(memberDataNullDate);

            document.body.innerHTML = `
                <span data-ms-member="signup-date.DateTimeFormat()">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('Loading...');
        });

        it('should preserve element attributes while updating signup date', () => {
            document.body.innerHTML = `
                <span data-ms-member="signup-date.DateTimeFormat()" 
                      class="date-display" 
                      id="member-signup" 
                      data-custom="value">Loading...</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(1);

            const element = document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]') as HTMLElement;
            expect(element.textContent).toBe('1/15/2024');
            expect(element.className).toBe('date-display');
            expect(element.id).toBe('member-signup');
            expect(element.getAttribute('data-custom')).toBe('value');
        });
    });

    describe('mixed attributes', () => {
        it('should handle both membership and signup-date attributes together', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
                <div data-ms-member="membership.amount">$0</div>
                <p data-ms-member="signup-date.DateTimeFormat()">Loading...</p>
                <span data-ms-member="membership.status">unknown</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(4);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Premium Plan');
            expect(document.querySelector('[data-ms-member="membership.amount"]')?.textContent).toBe('2999');
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('1/15/2024');
            expect(document.querySelector('[data-ms-member="membership.status"]')?.textContent).toBe('active');

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with membership-related data-ms-member attributes');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with signup-date.DateTimeFormat() attributes');
        });

        it('should ignore unhandled attribute types', () => {
            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
                <div data-ms-member="profile.email">Should not change</div>
                <p data-ms-member="signup-date.DateTimeFormat()">Loading...</p>
                <p data-ms-member="signup-date">Should not change...</p>
                <span data-ms-member="custom.field">Should not change</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(2);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Premium Plan');
            expect(document.querySelector('[data-ms-member="profile.email"]')?.textContent).toBe('Should not change');
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('1/15/2024');
            expect(document.querySelector('[data-ms-member="signup-date"]')?.textContent).toBe('Should not change...'); // it will change, but Memberstack 2.0 would handle it
            expect(document.querySelector('[data-ms-member="custom.field"]')?.textContent).toBe('Should not change');
        });
    });

    describe('error conditions', () => {
        it('should return 0 when not authenticated', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(false);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
                <div data-ms-member="signup-date.DateTimeFormat()">Loading...</div>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-member="membership.name"]')?.textContent).toBe('Loading...');
            expect(document.querySelector('[data-ms-member="signup-date.DateTimeFormat()"]')?.textContent).toBe('Loading...');
        });

        it('should return 0 when member data is null', () => {
            vi.mocked(getCurrentMemberV2).mockReturnValue(null);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Loading...</span>
                <div data-ms-member="signup-date.DateTimeFormat()">Loading...</div>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] Failed to fetch member data');
        });

        it('should return 0 when no relevant elements found', () => {
            document.body.innerHTML = `
                <div data-ms-member="profile.name">Should not change</div>
                <span data-custom="value">Normal element</span>
            `;

            const result = updateAllMemberAttributes(mockImportedMemberships);

            expect(result).toBe(0);
        });
    });
});