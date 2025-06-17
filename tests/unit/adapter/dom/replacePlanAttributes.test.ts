
import { describe, it, expect, beforeEach } from 'vitest';
import { getPlanAttribute, replacePlanAttribute, replaceMembershipAttribute, replaceSignupHref, updateAllPlanAttributes } from '@dom/replacePlanAttributes';

describe('getPlanAttribute', () => {
    it('should return price attribute for price IDs', () => {
        expect(getPlanAttribute('prc_123')).toBe('data-ms-plan:price');
        expect(getPlanAttribute('prc_abc')).toBe('data-ms-plan:price');
    });

    it('should return add attribute for plan IDs', () => {
        expect(getPlanAttribute('pln_123')).toBe('data-ms-plan:add');
        expect(getPlanAttribute('pln_xyz')).toBe('data-ms-plan:add');
    });

    it('should return null for invalid IDs', () => {
        expect(getPlanAttribute('invalid_123')).toBeNull();
        expect(getPlanAttribute('abc_123')).toBeNull();
        expect(getPlanAttribute('')).toBeNull();
    });
});

describe('replacePlanAttribute', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
        // Create a mock HTML element
        mockElement = document.createElement('div');
        mockElement.setAttribute('data-ms-plan', 'old_id');

    });

    it('should replace attribute for price plans', () => {
        const importedMemberships = { 'old_id': 'prc_new123' };

        replacePlanAttribute(mockElement, 'old_id', importedMemberships);

        expect(mockElement.hasAttribute('data-ms-plan')).toBe(false);
        expect(mockElement.getAttribute('data-ms-plan:price')).toBe('prc_new123');
    });

    it('should replace attribute for add plans', () => {
        const importedMemberships = { 'old_id': 'pln_new123' };

        replacePlanAttribute(mockElement, 'old_id', importedMemberships);

        expect(mockElement.hasAttribute('data-ms-plan')).toBe(false);
        expect(mockElement.getAttribute('data-ms-plan:add')).toBe('pln_new123');
    });

    it('should do nothing if newId is not found', () => {
        const importedMemberships = {};

        replacePlanAttribute(mockElement, 'old_id', importedMemberships);

        expect(mockElement.getAttribute('data-ms-plan')).toBe('old_id');
    });

    it('should do nothing if newId has invalid format', () => {
        const importedMemberships = { 'old_id': 'invalid_123' };

        replacePlanAttribute(mockElement, 'old_id', importedMemberships);

        expect(mockElement.getAttribute('data-ms-plan')).toBe('old_id');
    });
});

describe('replaceMembershipAttribute', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
        // Create a mock HTML element
        mockElement = document.createElement('div');
        mockElement.setAttribute('data-ms-membership', 'old_membership_id');
    });

    it('should replace membership attribute with price plan', () => {
        const importedMemberships = { 'old_membership_id': 'prc_new123' };

        replaceMembershipAttribute(mockElement, 'old_membership_id', importedMemberships);

        expect(mockElement.hasAttribute('data-ms-membership')).toBe(false);
        expect(mockElement.getAttribute('data-ms-plan:price')).toBe('prc_new123');
    });

    it('should replace membership attribute with add plan', () => {
        const importedMemberships = { 'old_membership_id': 'pln_new456' };

        replaceMembershipAttribute(mockElement, 'old_membership_id', importedMemberships);

        expect(mockElement.hasAttribute('data-ms-membership')).toBe(false);
        expect(mockElement.getAttribute('data-ms-plan:add')).toBe('pln_new456');
    });

    it('should do nothing if newId is not found', () => {
        const importedMemberships = {};

        replaceMembershipAttribute(mockElement, 'old_membership_id', importedMemberships);

        expect(mockElement.getAttribute('data-ms-membership')).toBe('old_membership_id');
    });

    it('should do nothing if newId has invalid format', () => {
        const importedMemberships = { 'old_membership_id': 'invalid_123' };

        replaceMembershipAttribute(mockElement, 'old_membership_id', importedMemberships);

        expect(mockElement.getAttribute('data-ms-membership')).toBe('old_membership_id');
    });
});

describe('replaceSignupHref', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
        mockElement = document.createElement('a');
        mockElement.setAttribute('href', '#/ms/signup/5c61ea857579e5001704b4ea');
    });

    it('should replace signup href with modal and price plan attributes', () => {
        const importedMemberships = { '5c61ea857579e5001704b4ea': 'prc_new123' };

        replaceSignupHref(mockElement, '5c61ea857579e5001704b4ea', importedMemberships);

        expect(mockElement.getAttribute('href')).toBe('#');
        expect(mockElement.getAttribute('data-ms-modal')).toBe('signup');
        expect(mockElement.getAttribute('data-ms-plan:price')).toBe('prc_new123');
    });

    it('should replace signup href with modal and add plan attributes', () => {
        const importedMemberships = { '5c61ea857579e5001704b4ea': 'pln_new456' };

        replaceSignupHref(mockElement, '5c61ea857579e5001704b4ea', importedMemberships);

        expect(mockElement.getAttribute('href')).toBe('#');
        expect(mockElement.getAttribute('data-ms-modal')).toBe('signup');
        expect(mockElement.getAttribute('data-ms-plan:add')).toBe('pln_new456');
    });

    it('should do nothing if extractedId is not found in mapping', () => {
        const importedMemberships = {};

        replaceSignupHref(mockElement, '5c61ea857579e5001704b4ea', importedMemberships);

        expect(mockElement.getAttribute('href')).toBe('#/ms/signup/5c61ea857579e5001704b4ea');
        expect(mockElement.hasAttribute('data-ms-modal')).toBe(false);
    });

    it('should do nothing if newId has invalid format', () => {
        const importedMemberships = { '5c61ea857579e5001704b4ea': 'invalid_123' };

        replaceSignupHref(mockElement, '5c61ea857579e5001704b4ea', importedMemberships);

        expect(mockElement.getAttribute('href')).toBe('#/ms/signup/5c61ea857579e5001704b4ea');
        expect(mockElement.hasAttribute('data-ms-modal')).toBe(false);
    });

    it('should work with different ID formats in href', () => {
        const shortId = 'abc123';
        mockElement.setAttribute('href', `#/ms/signup/${shortId}`);
        const importedMemberships = { [shortId]: 'prc_short' };

        replaceSignupHref(mockElement, shortId, importedMemberships);

        expect(mockElement.getAttribute('href')).toBe('#');
        expect(mockElement.getAttribute('data-ms-modal')).toBe('signup');
        expect(mockElement.getAttribute('data-ms-plan:price')).toBe('prc_short');
    });
});

describe('updateAllPlanAttributes', () => {
    beforeEach(() => {
        // Clear the document body
        document.body.innerHTML = '';
    });

    it('should update all elements with data-ms-plan attribute', () => {
        // Setup DOM
        document.body.innerHTML = `
      <div data-ms-plan="old_price_1">Price Plan 1</div>
      <div data-ms-plan="old_plan_1">Add Plan 1</div>
      <div data-ms-plan="old_invalid">Invalid Plan</div>
      <div>No plan attribute</div>
    `;

        const importedMemberships = {
            'old_price_1': 'prc_new123',
            'old_plan_1': 'pln_new456',
            'old_invalid': 'invalid_789'
        };

        updateAllPlanAttributes(importedMemberships);

        const elements = document.querySelectorAll('[data-ms-plan\\:price], [data-ms-plan\\:add]');
        expect(elements).toHaveLength(2);

        const priceElement = document.querySelector('[data-ms-plan\\:price]');
        expect(priceElement?.getAttribute('data-ms-plan:price')).toBe('prc_new123');

        const addElement = document.querySelector('[data-ms-plan\\:add]');
        expect(addElement?.getAttribute('data-ms-plan:add')).toBe('pln_new456');

        // Invalid plan should remain unchanged
        const invalidElement = document.querySelector('[data-ms-plan="old_invalid"]');
        expect(invalidElement).toBeTruthy();
    });

    it('should update all elements with data-ms-membership attribute', () => {
        // Setup DOM
        document.body.innerHTML = `
      <div data-ms-membership="old_membership_1">Membership 1</div>
      <div data-ms-membership="old_membership_2">Membership 2</div>
      <div data-ms-membership="old_invalid_membership">Invalid Membership</div>
      <div>No membership attribute</div>
    `;

        const importedMemberships = {
            'old_membership_1': 'prc_new789',
            'old_membership_2': 'pln_new012',
            'old_invalid_membership': 'invalid_345'
        };

        updateAllPlanAttributes(importedMemberships);

        const elements = document.querySelectorAll('[data-ms-plan\\:price], [data-ms-plan\\:add]');
        expect(elements).toHaveLength(2);

        const priceElement = document.querySelector('[data-ms-plan\\:price]');
        expect(priceElement?.getAttribute('data-ms-plan:price')).toBe('prc_new789');

        const addElement = document.querySelector('[data-ms-plan\\:add]');
        expect(addElement?.getAttribute('data-ms-plan:add')).toBe('pln_new012');

        // Invalid membership should remain unchanged
        const invalidElement = document.querySelector('[data-ms-membership="old_invalid_membership"]');
        expect(invalidElement).toBeTruthy();
    });

    it('should update both data-ms-plan and data-ms-membership attributes', () => {
        // Setup DOM with mixed attributes
        document.body.innerHTML = `
      <div data-ms-plan="old_plan_1">Plan 1</div>
      <div data-ms-membership="old_membership_1">Membership 1</div>
      <div data-ms-plan="old_plan_2">Plan 2</div>
      <div data-ms-membership="old_membership_2">Membership 2</div>
    `;

        const importedMemberships = {
            'old_plan_1': 'prc_plan123',
            'old_membership_1': 'pln_membership456',
            'old_plan_2': 'pln_plan789',
            'old_membership_2': 'prc_membership012'
        };

        updateAllPlanAttributes(importedMemberships);

        const priceElements = document.querySelectorAll('[data-ms-plan\\:price]');
        const addElements = document.querySelectorAll('[data-ms-plan\\:add]');

        expect(priceElements).toHaveLength(2);
        expect(addElements).toHaveLength(2);

        // Check that old attributes are removed
        expect(document.querySelector('[data-ms-plan]')).toBeNull();
        expect(document.querySelector('[data-ms-membership]')).toBeNull();
    });

    it('should update signup href links', () => {
        document.body.innerHTML = `
            <a href="#/ms/signup/5c61ea857579e5001704b4ea">Sign Up Link 1</a>
            <a href="#/ms/signup/another_id_123">Sign Up Link 2</a>
            <a href="#/ms/signup/invalid_mapping">Invalid Link</a>
            <a href="#/other/link">Other Link</a>
        `;

        const importedMemberships = {
            '5c61ea857579e5001704b4ea': 'prc_signup123',
            'another_id_123': 'pln_signup456'
        };

        updateAllPlanAttributes(importedMemberships);

        // Check converted signup links
        const modalElements = document.querySelectorAll('[data-ms-modal="signup"]');
        expect(modalElements).toHaveLength(2);

        const priceSignup = document.querySelector('[data-ms-plan\\:price="prc_signup123"]');
        const addSignup = document.querySelector('[data-ms-plan\\:add="pln_signup456"]');

        expect(priceSignup).toBeTruthy();
        expect(addSignup).toBeTruthy();
        expect(priceSignup?.getAttribute('data-ms-modal')).toBe('signup');
        expect(addSignup?.getAttribute('data-ms-modal')).toBe('signup');

        // Check that href attributes are removed from converted links
        expect(priceSignup?.getAttribute('href')).toBe('#');
        expect(addSignup?.getAttribute('href')).toBe('#');

        // Check that invalid mapping link remains unchanged
        const invalidLink = document.querySelector('a[href="#/ms/signup/invalid_mapping"]');
        expect(invalidLink).toBeTruthy();

        // Check that other links are not affected
        const otherLink = document.querySelector('a[href="#/other/link"]');
        expect(otherLink).toBeTruthy();
    });

    it('should handle mixed attributes including signup hrefs', () => {
        document.body.innerHTML = `
            <div data-ms-plan="old_plan_1">Plan 1</div>
            <div data-ms-membership="old_membership_1">Membership 1</div>
            <a href="#/ms/signup/signup_id_1">Signup Link</a>
            <button data-ms-plan="old_plan_2">Plan Button</button>
        `;

        const importedMemberships = {
            'old_plan_1': 'prc_mixed123',
            'old_membership_1': 'pln_mixed456',
            'signup_id_1': 'prc_mixed789',
            'old_plan_2': 'pln_mixed012'
        };

        updateAllPlanAttributes(importedMemberships);

        const priceElements = document.querySelectorAll('[data-ms-plan\\:price]');
        const addElements = document.querySelectorAll('[data-ms-plan\\:add]');
        const modalElements = document.querySelectorAll('[data-ms-modal="signup"]');

        expect(priceElements).toHaveLength(2); // old_plan_1 and signup_id_1
        expect(addElements).toHaveLength(2); // old_membership_1 and old_plan_2
        expect(modalElements).toHaveLength(1); // signup_id_1

        // Verify no old attributes remain
        expect(document.querySelector('[data-ms-plan]')).toBeNull();
        expect(document.querySelector('[data-ms-membership]')).toBeNull();
        expect(document.querySelector('a[href^="#/ms/signup/"]')).toBeNull();
    });

    it('should handle edge cases with signup hrefs', () => {
        document.body.innerHTML = `
            <a href="#/ms/signup/">Empty ID</a>
            <a href="#/ms/signup/id_with_special/chars">ID with slash</a>
            <a href="#/ms/signup/normal_id">Normal ID</a>
        `;

        const importedMemberships = {
            'normal_id': 'prc_normal123'
        };

        updateAllPlanAttributes(importedMemberships);

        // Only the normal ID should be converted
        const modalElements = document.querySelectorAll('[data-ms-modal="signup"]');
        expect(modalElements).toHaveLength(1);

        // Other malformed hrefs should remain unchanged
        expect(document.querySelector('a[href="#/ms/signup/"]')).toBeTruthy();
        expect(document.querySelector('a[href="#/ms/signup/id_with_special/chars"]')).toBeTruthy();
    });

    it('should handle empty document', () => {
        const importedMemberships = { 'test': 'prc_123' };

        expect(() => updateAllPlanAttributes(importedMemberships)).not.toThrow();
    });
});