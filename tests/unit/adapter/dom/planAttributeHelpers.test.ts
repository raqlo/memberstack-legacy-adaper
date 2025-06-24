import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getPlanAttribute,
    replaceDataMsPlanAttribute,
    replaceDataMsMembershipAttribute,
    processDataMsPlanAttributes,
    processDataMsMembershipAttributes
} from '@dom/planAttributeHelpers';

// Mock the logger
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

// Mock DOM
const mockElement = (tagName: string = 'div', attributes: Record<string, string> = {}) => {
    const element = {
        tagName: tagName.toUpperCase(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        ...attributes
    } as unknown as HTMLElement;

    // Setup getAttribute mock
    Object.entries(attributes).forEach(([key, value]) => {
        (element.getAttribute as any).mockImplementation((attr: string) =>
            attr === key ? value : null
        );
    });

    return element;
};

describe('planAttributeHelpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset DOM
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getPlanAttribute', () => {
        it('should return data-ms-plan:price for price IDs', () => {
            expect(getPlanAttribute('prc_123456')).toBe('data-ms-plan:price');
            expect(getPlanAttribute('prc_abc123')).toBe('data-ms-plan:price');
        });

        it('should return data-ms-plan:add for plan IDs', () => {
            expect(getPlanAttribute('pln_123456')).toBe('data-ms-plan:add');
            expect(getPlanAttribute('pln_abc123')).toBe('data-ms-plan:add');
        });

        it('should return null for invalid ID formats', () => {
            expect(getPlanAttribute('mem_123456')).toBeNull();
            expect(getPlanAttribute('invalid_id')).toBeNull();
            expect(getPlanAttribute('123456')).toBeNull();
            expect(getPlanAttribute('')).toBeNull();
        });

        it('should handle edge cases', () => {
            expect(getPlanAttribute('prc_')).toBe('data-ms-plan:price');
            expect(getPlanAttribute('pln_')).toBe('data-ms-plan:add');
            expect(getPlanAttribute('PRC_123')).toBeNull(); // case sensitive
            expect(getPlanAttribute('PLN_123')).toBeNull(); // case sensitive
        });
    });

    describe('replaceDataMsPlanAttribute', () => {
        it('should successfully replace plan attribute with price ID', () => {
            const element = mockElement('button');
            const importedMemberships = [{ name: 'free', oldId: 'mem_old123', newId: 'prc_new456' }];

            replaceDataMsPlanAttribute(element, 'mem_old123', importedMemberships);

            expect(element.removeAttribute).toHaveBeenCalledWith('data-ms-plan');
            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-plan:price', 'prc_new456');
        });

        it('should successfully replace plan attribute with plan ID', () => {
            const element = mockElement('button');
            const importedMemberships = [{ name: 'premium', oldId: 'mem_old123', newId: 'pln_new456' }];

            replaceDataMsPlanAttribute(element, 'mem_old123', importedMemberships);

            expect(element.removeAttribute).toHaveBeenCalledWith('data-ms-plan');
            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-plan:add', 'pln_new456');
        });

        it('should handle missing old ID in mapping', () => {
            const element = mockElement('button');
            const importedMemberships = [{ name: 'basic', oldId: 'mem_other', newId: 'prc_new456' }];

            replaceDataMsPlanAttribute(element, 'mem_old123', importedMemberships);

            expect(element.removeAttribute).not.toHaveBeenCalled();
            expect(element.setAttribute).not.toHaveBeenCalled();
        });

        it('should handle invalid new ID format', () => {
            const element = mockElement('button');
            const importedMemberships = [{ name: 'invalid', oldId: 'mem_old123', newId: 'invalid_new456' }];

            replaceDataMsPlanAttribute(element, 'mem_old123', importedMemberships);

            expect(element.removeAttribute).not.toHaveBeenCalled();
            expect(element.setAttribute).not.toHaveBeenCalled();
        });
    });

    describe('replaceDataMsMembershipAttribute', () => {
        it('should successfully replace membership attribute', () => {
            const element = mockElement('div');
            const importedMemberships = [{ name: 'starter', oldId: 'mem_old123', newId: 'prc_new456' }];

            replaceDataMsMembershipAttribute(element, 'mem_old123', importedMemberships);

            expect(element.removeAttribute).toHaveBeenCalledWith('data-ms-membership');
            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-plan:price', 'prc_new456');
        });

        it('should add modal attribute to anchor tags with href="#"', () => {
            const element = mockElement('a', { href: '#' });
            const importedMemberships = [{ name: 'pro', oldId: 'mem_old123', newId: 'pln_new456' }];

            replaceDataMsMembershipAttribute(element, 'mem_old123', importedMemberships);

            expect(element.removeAttribute).toHaveBeenCalledWith('data-ms-membership');
            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-plan:add', 'pln_new456');
            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-modal', 'signup');
        });

        it('should not add modal attribute to anchor tags without href="#"', () => {
            const element = mockElement('a', { href: '/signup' });
            const importedMemberships = [{ name: 'enterprise', oldId: 'mem_old123', newId: 'pln_new456' }];

            replaceDataMsMembershipAttribute(element, 'mem_old123', importedMemberships);

            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-plan:add', 'pln_new456');
            expect(element.setAttribute).not.toHaveBeenCalledWith('data-ms-modal', 'signup');
        });

        it('should not add modal attribute to non-anchor elements', () => {
            const element = mockElement('button');
            const importedMemberships = [{ name: 'basic', oldId: 'mem_old123', newId: 'pln_new456' }];

            replaceDataMsMembershipAttribute(element, 'mem_old123', importedMemberships);

            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-plan:add', 'pln_new456');
            expect(element.setAttribute).not.toHaveBeenCalledWith('data-ms-modal', 'signup');
        });

        it('should handle case-insensitive tag names', () => {
            const element = mockElement('A', { href: '#' });
            const importedMemberships = [{ name: 'premium', oldId: 'mem_old123', newId: 'pln_new456' }];

            replaceDataMsMembershipAttribute(element, 'mem_old123', importedMemberships);

            expect(element.setAttribute).toHaveBeenCalledWith('data-ms-modal', 'signup');
        });
    });

    describe('processDataMsPlanAttributes', () => {
        it('should process all elements with data-ms-plan attribute', () => {
            // Setup DOM
            document.body.innerHTML = `
                <button data-ms-plan="mem_old1">Plan 1</button>
                <div data-ms-plan="mem_old2">Plan 2</div>
                <span>No attribute</span>
            `;

            const importedMemberships = [
                { name: 'starter', oldId: 'mem_old1', newId: 'prc_new1' },
                { name: 'pro', oldId: 'mem_old2', newId: 'pln_new2' }
            ];

            const result = processDataMsPlanAttributes(importedMemberships);

            expect(result).toBe(2);

            // Check that attributes were processed
            const button = document.querySelector('button');
            const div = document.querySelector('div');

            expect(button?.getAttribute('data-ms-plan')).toBeNull();
            expect(div?.getAttribute('data-ms-plan')).toBeNull();
        });

        it('should return 0 when no elements found', () => {
            document.body.innerHTML = '<div>No plan attributes</div>';

            const result = processDataMsPlanAttributes([]);

            expect(result).toBe(0);
        });

        it('should handle elements with empty data-ms-plan attributes', () => {
            document.body.innerHTML = '<button data-ms-plan="">Empty</button>';

            const result = processDataMsPlanAttributes([{ name: 'empty', oldId: '', newId: 'prc_123' }]);

            expect(result).toBe(1);
        });
    });

    describe('processDataMsMembershipAttributes', () => {
        it('should process all elements with data-ms-membership attribute', () => {
            // Setup DOM
            document.body.innerHTML = `
                <a href="#" data-ms-membership="mem_old1">Join Plan 1</a>
                <button data-ms-membership="mem_old2">Subscribe Plan 2</button>
                <div>No attribute</div>
            `;

            const importedMemberships = [
                { name: 'basic', oldId: 'mem_old1', newId: 'pln_new1' },
                { name: 'premium', oldId: 'mem_old2', newId: 'prc_new2' }
            ];

            const result = processDataMsMembershipAttributes(importedMemberships);

            expect(result).toBe(2);

            // Check that attributes were processed
            const link = document.querySelector('a');
            const button = document.querySelector('button');

            expect(link?.getAttribute('data-ms-membership')).toBeNull();
            expect(button?.getAttribute('data-ms-membership')).toBeNull();
            expect(link?.getAttribute('data-ms-modal')).toBe('signup');
        });

        it('should return 0 when no elements found', () => {
            document.body.innerHTML = '<div>No membership attributes</div>';

            const result = processDataMsMembershipAttributes([]);

            expect(result).toBe(0);
        });

        it('should handle mixed scenarios', () => {
            document.body.innerHTML = `
                <a href="#" data-ms-membership="mem_valid">Valid</a>
                <button data-ms-membership="mem_invalid">Invalid mapping</button>
                <a href="/page" data-ms-membership="mem_valid2">No modal</a>
            `;

            const importedMemberships = [
                { name: 'valid', oldId: 'mem_valid', newId: 'pln_new1' },
                { name: 'valid2', oldId: 'mem_valid2', newId: 'prc_new2' }
                // mem_invalid not in mapping
            ];

            const result = processDataMsMembershipAttributes(importedMemberships);

            expect(result).toBe(3); // Still counts elements found, not processed
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete workflow with mixed attributes', () => {
            document.body.innerHTML = `
                <button data-ms-plan="mem_plan1">Subscribe</button>
                <a href="#" data-ms-membership="mem_membership1">Join</a>
                <div data-ms-plan="mem_plan2">Another Plan</div>
            `;

            const importedMemberships = [
                { name: 'plan1', oldId: 'mem_plan1', newId: 'prc_price1' },
                { name: 'membership1', oldId: 'mem_membership1', newId: 'pln_plan1' },
                { name: 'plan2', oldId: 'mem_plan2', newId: 'pln_plan2' }
            ];

            const planResult = processDataMsPlanAttributes(importedMemberships);
            const membershipResult = processDataMsMembershipAttributes(importedMemberships);

            expect(planResult).toBe(2);
            expect(membershipResult).toBe(1);

            // Verify transformations
            const button = document.querySelector('button');
            const link = document.querySelector('a');
            const div = document.querySelector('div');

            expect(button?.getAttribute('data-ms-plan:price')).toBe('prc_price1');
            expect(link?.getAttribute('data-ms-plan:add')).toBe('pln_plan1');
            expect(link?.getAttribute('data-ms-modal')).toBe('signup');
            expect(div?.getAttribute('data-ms-plan:add')).toBe('pln_plan2');
        });
    });
});