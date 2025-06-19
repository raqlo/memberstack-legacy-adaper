import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateRewriteAttributes } from '@dom/memberRewriteAttributes';
import { logger } from '@utils/logger';

vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

vi.mock('@utils/sessions', () => ({
    isMemberAuthV2: vi.fn(() => true)
}));

import { isMemberAuthV2 } from '@utils/sessions';

describe('rewriteAttributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isMemberAuthV2).mockReturnValue(true);
        document.body.innerHTML = '';
    });

    describe('data-ms-rewrite attributes', () => {
        it('should replace content with data-ms-rewrite value when authenticated', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Welcome back!">Login</span>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-rewrite]')?.textContent).toBe('Welcome back!');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with data-ms-rewrite attribute');
        });

        it('should handle multiple data-ms-rewrite elements', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Welcome back!">Login</span>
                <div data-ms-rewrite="Member Area">Public Area</div>
                <button data-ms-rewrite="Dashboard">Sign Up</button>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(3);
            expect(document.querySelector('[data-ms-rewrite="Welcome back!"]')?.textContent).toBe('Welcome back!');
            expect(document.querySelector('[data-ms-rewrite="Member Area"]')?.textContent).toBe('Member Area');
            expect(document.querySelector('[data-ms-rewrite="Dashboard"]')?.textContent).toBe('Dashboard');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with data-ms-rewrite attribute');
        });

        it('should skip data-ms-rewrite elements with empty values', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Welcome back!">Login</span>
                <button data-ms-rewrite="">Should not change</button>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('[data-ms-rewrite="Welcome back!"]')?.textContent).toBe('Welcome back!');
            expect(document.querySelector('button')?.textContent).toBe('Should not change');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 2 elements with data-ms-rewrite attribute');
        });
    });

    describe('ms-rewrite attributes', () => {
        it('should replace content with ms-rewrite value when authenticated', () => {
            document.body.innerHTML = `
                <button ms-rewrite="Go to Dashboard">Sign Up</button>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('[ms-rewrite]')?.textContent).toBe('Go to Dashboard');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with data-ms-rewrite attribute');
        });

        it('should handle multiple ms-rewrite elements', () => {
            document.body.innerHTML = `
                <button ms-rewrite="Go to Dashboard">Sign Up</button>
                <div ms-rewrite="Premium Content">Free Content</div>
                <span ms-rewrite="Logout">Login</span>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(3);
            expect(document.querySelector('[ms-rewrite="Go to Dashboard"]')?.textContent).toBe('Go to Dashboard');
            expect(document.querySelector('[ms-rewrite="Premium Content"]')?.textContent).toBe('Premium Content');
            expect(document.querySelector('[ms-rewrite="Logout"]')?.textContent).toBe('Logout');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with data-ms-rewrite attribute');
        });

        it('should skip ms-rewrite elements with empty values', () => {
            document.body.innerHTML = `
                <button ms-rewrite="Valid Text">Sign Up</button>
                <div ms-rewrite="">Should not change</div>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('[ms-rewrite="Valid Text"]')?.textContent).toBe('Valid Text');
            expect(document.querySelector('div')?.textContent).toBe('Should not change');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 2 elements with data-ms-rewrite attribute');
        });
    });

    describe('mixed attribute combinations', () => {
        it('should handle both data-ms-rewrite and ms-rewrite together', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Welcome back!">Login</span>
                <button ms-rewrite="Go to Dashboard">Sign Up</button>
                <div data-ms-rewrite="Member Area">Public Area</div>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(3);
            expect(document.querySelector('[data-ms-rewrite="Welcome back!"]')?.textContent).toBe('Welcome back!');
            expect(document.querySelector('[ms-rewrite="Go to Dashboard"]')?.textContent).toBe('Go to Dashboard');
            expect(document.querySelector('[data-ms-rewrite="Member Area"]')?.textContent).toBe('Member Area');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with data-ms-rewrite attribute');
        });

        it('should prioritize data-ms-rewrite over ms-rewrite when both exist on same element', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Priority Text" ms-rewrite="Secondary Text">Original</span>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(1);
            expect(document.querySelector('span')?.textContent).toBe('Priority Text');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with data-ms-rewrite attribute');
        });

        it('should handle mixed scenarios with some empty values', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Valid Text">Original</span>
                <button data-ms-rewrite="">Empty Data</button>
                <div ms-rewrite="Another Valid">Original2</div>
                <p ms-rewrite="">Empty MS</p>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(2);
            expect(document.querySelector('[data-ms-rewrite="Valid Text"]')?.textContent).toBe('Valid Text');
            expect(document.querySelector('button')?.textContent).toBe('Empty Data');
            expect(document.querySelector('[ms-rewrite="Another Valid"]')?.textContent).toBe('Another Valid');
            expect(document.querySelector('p')?.textContent).toBe('Empty MS');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 4 elements with data-ms-rewrite attribute');
        });

        it('should handle complex combinations with multiple conflicts', () => {
            document.body.innerHTML = `
                <span data-ms-rewrite="Data Priority" ms-rewrite="MS Secondary">Original 1</span>
                <button ms-rewrite="Only MS">Original 2</button>
                <div data-ms-rewrite="Only Data">Original 3</div>
                <p data-ms-rewrite="" ms-rewrite="MS Fallback">Original 4</p>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(4);
            expect(document.querySelector('span')?.textContent).toBe('Data Priority');
            expect(document.querySelector('button')?.textContent).toBe('Only MS');
            expect(document.querySelector('div')?.textContent).toBe('Only Data');
            expect(document.querySelector('p')?.textContent).toBe('MS Fallback');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 4 elements with data-ms-rewrite attribute');
        });
    });

    describe('authentication and edge cases', () => {
        it('should return 0 when not authenticated', () => {
            vi.mocked(isMemberAuthV2).mockReturnValue(false);

            document.body.innerHTML = `
                <span data-ms-rewrite="Welcome back!">Login</span>
                <button ms-rewrite="Go to Dashboard">Sign Up</button>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(0);
            expect(document.querySelector('[data-ms-rewrite]')?.textContent).toBe('Login');
            expect(document.querySelector('[ms-rewrite]')?.textContent).toBe('Sign Up');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 2 elements with data-ms-rewrite attribute');
        });

        it('should return 0 when no rewrite elements found', () => {
            document.body.innerHTML = `
                <div>No rewrite attributes here</div>
                <span>Just regular content</span>
            `;

            const result = updateRewriteAttributes();

            expect(result).toBe(0);
            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
        });
    });
});