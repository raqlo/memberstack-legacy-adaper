import { describe, it, expect, beforeEach } from 'vitest';
import {replaceLogoutAttribute, updateAllLogoutAttributes} from "../../../../src/adapter/dom/replaceLogoutAttributes";

describe('replaceLogoutAttribute', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
        mockElement = document.createElement('div');
    });

    it('should replace data-ms-logout with data-ms-action="logout"', () => {
        mockElement.setAttribute('data-ms-logout', '');

        replaceLogoutAttribute(mockElement);

        expect(mockElement.hasAttribute('data-ms-logout')).toBe(false);
        expect(mockElement.getAttribute('data-ms-action')).toBe('logout');
    });

    it('should replace ms-logout with data-ms-action="logout"', () => {
        mockElement.setAttribute('ms-logout', '');

        replaceLogoutAttribute(mockElement);

        expect(mockElement.hasAttribute('ms-logout')).toBe(false);
        expect(mockElement.getAttribute('data-ms-action')).toBe('logout');
    });

    it('should replace both attributes if both exist', () => {
        mockElement.setAttribute('data-ms-logout', '');
        mockElement.setAttribute('ms-logout', '');

        replaceLogoutAttribute(mockElement);

        expect(mockElement.hasAttribute('data-ms-logout')).toBe(false);
        expect(mockElement.hasAttribute('ms-logout')).toBe(false);
        expect(mockElement.getAttribute('data-ms-action')).toBe('logout');
    });

    it('should work even if old attributes do not exist', () => {
        replaceLogoutAttribute(mockElement);

        expect(mockElement.getAttribute('data-ms-action')).toBe('logout');
    });
});

describe('updateAllLogoutAttributes', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('should update all elements with data-ms-logout attribute', () => {
        document.body.innerHTML = `
            <button data-ms-logout>Logout Button 1</button>
            <a data-ms-logout href="#">Logout Link 1</a>
            <div data-ms-logout>Logout Div</div>
        `;

        updateAllLogoutAttributes();

        const actionElements = document.querySelectorAll('[data-ms-action="logout"]');
        expect(actionElements).toHaveLength(3);

        const oldElements = document.querySelectorAll('[data-ms-logout]');
        expect(oldElements).toHaveLength(0);
    });

    it('should update all elements with ms-logout attribute', () => {
        document.body.innerHTML = `
            <button ms-logout>Logout Button 1</button>
            <a ms-logout href="#">Logout Link 1</a>
            <div ms-logout>Logout Div</div>
        `;

        updateAllLogoutAttributes();

        const actionElements = document.querySelectorAll('[data-ms-action="logout"]');
        expect(actionElements).toHaveLength(3);

        const oldElements = document.querySelectorAll('[ms-logout]');
        expect(oldElements).toHaveLength(0);
    });

    it('should update mixed attributes', () => {
        document.body.innerHTML = `
            <button data-ms-logout>Data Logout Button</button>
            <a ms-logout href="#">Ms Logout Link</a>
            <div data-ms-logout>Data Logout Div</div>
            <span ms-logout>Ms Logout Span</span>
            <p>No logout attribute</p>
        `;

        updateAllLogoutAttributes();

        const actionElements = document.querySelectorAll('[data-ms-action="logout"]');
        expect(actionElements).toHaveLength(4);

        const oldDataElements = document.querySelectorAll('[data-ms-logout]');
        const oldMsElements = document.querySelectorAll('[ms-logout]');
        expect(oldDataElements).toHaveLength(0);
        expect(oldMsElements).toHaveLength(0);

        // Check that elements without logout attributes are unchanged
        const pElement = document.querySelector('p');
        expect(pElement?.textContent).toBe('No logout attribute');
        expect(pElement?.hasAttribute('data-ms-action')).toBe(false);
    });

    it('should handle empty document', () => {
        expect(() => updateAllLogoutAttributes()).not.toThrow();
    });

    it('should handle elements with existing data-ms-action attribute', () => {
        document.body.innerHTML = `
            <button data-ms-logout data-ms-action="existing">Logout Button</button>
        `;

        updateAllLogoutAttributes();

        const button = document.querySelector('button');
        expect(button?.getAttribute('data-ms-action')).toBe('logout');
        expect(button?.hasAttribute('data-ms-logout')).toBe(false);
    });
});