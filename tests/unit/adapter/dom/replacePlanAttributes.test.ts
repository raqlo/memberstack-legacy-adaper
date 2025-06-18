import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    getPlanAttribute,
    replaceMembershipAttribute,
    replacePlanAttribute,
    replaceSignupHref,
    updateAllPlanAttributes
} from '@dom/replacePlanAttributes';
import {logger} from '@utils/logger';
import {getCurrentMemberV2, isMemberAuthV2} from '@utils/sessions';
import {replaceMemberAttribute, updateAllMemberAttributes} from "../../../../src/adapter/dom/replacePlanAttributes";

// Mock the dependencies
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

vi.mock('@utils/sessions', () => ({
    getCurrentMemberV2: vi.fn(),
    isMemberAuthV2: vi.fn()
}));

describe('Plan Attribute Functions', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('getPlanAttribute', () => {
        it('should return data-ms-plan:price for price IDs', () => {
            const result = getPlanAttribute('prc_123');
            expect(result).toBe('data-ms-plan:price');
        });

        it('should return data-ms-plan:add for plan IDs', () => {
            const result = getPlanAttribute('pln_456');
            expect(result).toBe('data-ms-plan:add');
        });

        it('should return null and log error for unknown format', () => {
            const result = getPlanAttribute('unknown_789');
            expect(result).toBeNull();
            expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('Unknown ID format'));
        });
    });

    describe('updateAllPlanAttributes', () => {
        it('should call warn when deprecated plan attributes are found', () => {
            document.body.innerHTML = `
            <div data-ms-plan="old_plan_1">Plan 1</div>
            <div data-ms-membership="old_membership_1">Membership 1</div>
            <a href="#/ms/signup/old_signup_1">Signup Link</a>
        `;

            const importedMemberships = {
                'old_plan_1': 'pln_new_plan_1',
                'old_membership_1': 'prc_new_membership_1',
                'old_signup_1': 'pln_new_signup_1'
            };

            updateAllPlanAttributes(importedMemberships);

            // Should have called warn for each type of deprecated attribute found
            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-plan attribute'));
            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-membership attribute'));
            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('elements with signup href attributes'));
        });

        it('should not call warn when no deprecated attributes exist', () => {
            document.body.innerHTML = `
            <div>Regular content</div>
            <a href="#regular-link">Regular Link</a>
        `;

            const importedMemberships = {};

            updateAllPlanAttributes(importedMemberships);

            // Should not have called warn for any deprecated attributes since none were found
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-plan attribute'));
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-membership attribute'));
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with signup href attributes'));
        });

        it('should handle mixed scenarios correctly', () => {
            document.body.innerHTML = `
            <div data-ms-plan="old_plan_1">Plan 1</div>
            <div>Regular content</div>
            <a href="#/ms/signup/old_signup_1">Signup Link</a>
        `;

            const importedMemberships = {
                'old_plan_1': 'pln_new_plan_1',
                'old_signup_1': 'pln_new_signup_1'
            };

            updateAllPlanAttributes(importedMemberships);

            // Should warn for plan and signup elements found, but NOT for membership (0 found, so no warning)
            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('1 elements with data-ms-plan attribute'));
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-membership attribute'));
            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('1 elements with signup href attributes'));
        });

        it('should handle empty document', () => {
            const importedMemberships = {};

            expect(() => updateAllPlanAttributes(importedMemberships)).not.toThrow();

            // Should NOT log any warnings since no deprecated elements were found
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-plan attribute'));
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-membership attribute'));
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with signup href attributes'));
        });

        it('should only warn for specific deprecated attribute types that exist', () => {
            // Test with only membership elements
            document.body.innerHTML = `
            <div data-ms-membership="old_membership_1">Membership 1</div>
            <div data-ms-membership="old_membership_2">Membership 2</div>
        `;

            const importedMemberships = {
                'old_membership_1': 'prc_new_membership_1',
                'old_membership_2': 'prc_new_membership_2'
            };

            updateAllPlanAttributes(importedMemberships);

            // Should only warn about membership elements
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-plan attribute'));
            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('2 elements with data-ms-membership attribute'));
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with signup href attributes'));
        });
    });

    describe('updateAllMemberAttributes', () => {
        const mockMemberData = {
            id: 'member_123',
            planConnections: [{
                planId: 'pln_test',
                status: 'active',
                payment: { amount: 2999 }
            }]
        };

        it('should call warn when deprecated member attributes are found', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(true);
            vi.mocked(getCurrentMemberV2).mockReturnValue(mockMemberData as any);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Member Name</span>
                <span data-ms-member="membership.amount">Member Amount</span>
                <span data-ms-member="membership.status">Member Status</span>
            `;

            updateAllMemberAttributes();

            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('3 elements with membership-related data-ms-member attributes'));
        });

        it('should not call warn when no deprecated member attributes exist', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(true);
            vi.mocked(getCurrentMemberV2).mockReturnValue(mockMemberData as any);

            document.body.innerHTML = `
                <span>Regular content</span>
                <span data-ms-member="profile.email">Profile Email</span>
            `;

            updateAllMemberAttributes();

            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('0 elements with membership-related data-ms-member attributes'));
        });

        it('should not process when member is not authenticated', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(false);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Member Name</span>
            `;

            updateAllMemberAttributes();

            // Should not call warn about deprecated attributes since processing was skipped
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with membership-related data-ms-member attributes'));
            expect(logger).toHaveBeenCalledWith('debug', expect.stringContaining('Member not authenticated'));
        });

        it('should not process when member data is not available', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(true);
            vi.mocked(getCurrentMemberV2).mockReturnValue(null);

            document.body.innerHTML = `
                <span data-ms-member="membership.name">Member Name</span>
            `;

            updateAllMemberAttributes();

            // Should not call warn about deprecated attributes since processing was skipped
            expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with membership-related data-ms-member attributes'));
            expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('Failed to fetch member data'));
        });

        it('should handle empty document when authenticated', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(true);
            vi.mocked(getCurrentMemberV2).mockReturnValue(mockMemberData as any);

            updateAllMemberAttributes();

            expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('0 elements with membership-related data-ms-member attributes'));
        });
    });

    describe('Individual replacement functions', () => {
        let mockElement: HTMLElement;

        beforeEach(() => {
            mockElement = document.createElement('div');
        });

        describe('replacePlanAttribute', () => {
            it('should log error when plan ID not found in mapping', () => {
                const importedMemberships = {};

                replacePlanAttribute(mockElement, 'missing_id', importedMemberships);

                expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('Plan ID "missing_id" not found'));
            });

            it('should log error when new ID has invalid format', () => {
                const importedMemberships = { 'old_id': 'invalid_format' };

                replacePlanAttribute(mockElement, 'old_id', importedMemberships);

                expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('Invalid new plan ID format'));
            });
        });

        describe('replaceMembershipAttribute', () => {
            it('should log error when membership ID not found in mapping', () => {
                const importedMemberships = {};

                replaceMembershipAttribute(mockElement, 'missing_id', importedMemberships);

                expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('Membership ID "missing_id" not found'));
            });
        });

        describe('replaceSignupHref', () => {
            it('should log error when signup ID not found in mapping', () => {
                const importedMemberships = {};

                replaceSignupHref(mockElement, 'missing_id', importedMemberships);

                expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('Signup href ID "missing_id" not found'));
            });
        });

        describe('replaceMemberAttribute', () => {
            const mockMemberData = {
                id: 'member_123',
                planConnections: [{
                    planId: 'pln_test',
                    status: 'active',
                    payment: { amount: 2999 }
                }]
            };

            it('should log error when no plan connections exist', () => {
                const memberDataNoPlan = { ...mockMemberData, planConnections: [] };

                replaceMemberAttribute(mockElement, 'membership.name', memberDataNoPlan as any);

                expect(logger).toHaveBeenCalledWith('error', expect.stringContaining('No plan connections found'));
            });
        });
    });
});