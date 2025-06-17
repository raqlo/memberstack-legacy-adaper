import { describe, it, expect, beforeEach } from 'vitest';
import { getPlanAttribute, replacePlanAttribute, updateAllPlanAttributes } from './replacePlanAttributes';

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

    it('should handle empty document', () => {
        const importedMemberships = { 'test': 'prc_123' };

        expect(() => updateAllPlanAttributes(importedMemberships)).not.toThrow();
    });
});