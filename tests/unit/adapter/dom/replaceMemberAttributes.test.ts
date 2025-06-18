import { describe, it, expect, beforeEach, vi } from 'vitest';

import {updateRewriteAttributes} from "@dom/replaceMemberAttributes";
import {isMemberAuthV2} from "../../../../src/utils/sessions";
import {logger} from "@utils/logger";

vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

vi.mock('@utils/sessions', () => ({
    getCurrentMemberV2: vi.fn(),
    isMemberAuthV2: vi.fn()
}));

describe('updateRewriteAttributes', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    const setupAuthenticatedMember = () => {
        vi.mocked(isMemberAuthV2).mockReturnValue(true);
    };

    const setupUnauthenticatedMember = () => {
        vi.mocked(isMemberAuthV2).mockReturnValue(false);
    };

    it('should call warn when rewrite attributes are found and member is authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <span data-ms-rewrite="Welcome back!">Default text</span>
            <div data-ms-rewrite="Member Dashboard">Public content</div>
        `;

        updateRewriteAttributes();

        expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('2 elements with data-ms-rewrite attribute'));
    });

    it('should not call warn when no rewrite attributes exist and member is authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <div>Regular content</div>
            <span>More content</span>
        `;

        updateRewriteAttributes();

        expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-rewrite attribute'));
    });

    it('should not process rewrite attributes when member is not authenticated', () => {
        setupUnauthenticatedMember();

        document.body.innerHTML = `
            <span data-ms-rewrite="Welcome back!">Default text</span>
        `;

        updateRewriteAttributes();

        // Should not call warn about rewrite attributes since processing was skipped
        expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-rewrite attribute'));
        expect(logger).toHaveBeenCalledWith('debug', expect.stringContaining('Member not authenticated'));
    });

    it('should update element content with rewrite value when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <span data-ms-rewrite="Member Content">Default text</span>
        `;

        const element = document.querySelector('[data-ms-rewrite]') as HTMLElement;
        expect(element.textContent).toBe('Default text');

        updateRewriteAttributes();

        expect(element.textContent).toBe('Member Content');
    });

    it('should handle multiple rewrite elements when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <span data-ms-rewrite="Welcome back!">Default text</span>
            <div data-ms-rewrite="Member Dashboard">Public content</div>
            <p data-ms-rewrite="Premium Features">Basic features</p>
        `;

        updateRewriteAttributes();

        const elements = document.querySelectorAll('[data-ms-rewrite]');
        expect(elements[0].textContent).toBe('Welcome back!');
        expect(elements[1].textContent).toBe('Member Dashboard');
        expect(elements[2].textContent).toBe('Premium Features');
    });

    it('should handle empty rewrite values when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <span data-ms-rewrite="">Default text</span>
        `;

        const element = document.querySelector('[data-ms-rewrite]') as HTMLElement;

        updateRewriteAttributes();

        // Should not change content when rewrite value is empty
        expect(element.textContent).toBe('Default text');
        expect(logger).toHaveBeenCalledWith('debug', expect.stringContaining('empty data-ms-rewrite attribute'));
    });

    it('should handle empty document when authenticated', () => {
        setupAuthenticatedMember();

        updateRewriteAttributes();

        expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with data-ms-rewrite attribute'));
        expect(logger).toHaveBeenCalledWith('debug', expect.stringContaining('No elements with data-ms-rewrite attribute found'));
    });
});