
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { replacePasswordResetHref, processPasswordResetUrls } from '@dom/hashUrlToForgotPasswordModal';
import { logger } from '@utils/logger';

// Mock logger
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

describe('passwordResetTransform', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('replacePasswordResetHref', () => {
        it('should replace href and add data-ms-modal attribute', () => {
            const element = document.createElement('a');
            element.setAttribute('href', '#/ms/password-reset');
            element.setAttribute('class', 'password-link');
            element.textContent = 'I forgot my password';
            document.body.appendChild(element);

            replacePasswordResetHref(element);

            expect(element.getAttribute('href')).toBe('#');
            expect(element.getAttribute('data-ms-modal')).toBe('forgot-password');
            expect(element.getAttribute('class')).toBe('password-link');
            expect(element.textContent).toBe('I forgot my password');
        });

        it('should preserve all existing attributes', () => {
            const element = document.createElement('a');
            element.setAttribute('href', '#/ms/password-reset');
            element.setAttribute('class', 'password-link btn-secondary');
            element.setAttribute('data-custom', 'value');
            element.setAttribute('id', 'forgot-password-btn');
            element.innerHTML = '<span>I forgot my password</span>';
            document.body.appendChild(element);

            replacePasswordResetHref(element);

            expect(element.getAttribute('href')).toBe('#');
            expect(element.getAttribute('data-ms-modal')).toBe('forgot-password');
            expect(element.getAttribute('class')).toBe('password-link btn-secondary');
            expect(element.getAttribute('data-custom')).toBe('value');
            expect(element.getAttribute('id')).toBe('forgot-password-btn');
            expect(element.innerHTML).toBe('<span>I forgot my password</span>');
        });

        it('should log debug messages correctly', () => {
            const element = document.createElement('a');
            element.setAttribute('href', '#/ms/password-reset');
            document.body.appendChild(element);

            replacePasswordResetHref(element);

            expect(logger).toHaveBeenCalledTimes(2);
        });
    });

    describe('processPasswordResetUrls - basic functionality', () => {
        it('should transform single password reset URL', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset" class="password-link">I forgot my password</a>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(1);
            const element = document.querySelector('a');
            expect(element?.getAttribute('href')).toBe('#');
            expect(element?.getAttribute('data-ms-modal')).toBe('forgot-password');
            expect(element?.getAttribute('class')).toBe('password-link');
            expect(element?.textContent).toBe('I forgot my password');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with password reset href attributes that will be converted to modal');
        });

        it('should handle multiple password reset URLs', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset" class="password-link">Forgot password 1</a>
                <a href="#/ms/password-reset" class="btn-link">Forgot password 2</a>
                <a href="#/ms/password-reset" id="reset-btn">Reset Password</a>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(3);

            const elements = document.querySelectorAll('a');
            elements.forEach(element => {
                expect(element.getAttribute('href')).toBe('#');
                expect(element.getAttribute('data-ms-modal')).toBe('forgot-password');
            });

            expect(elements[0].getAttribute('class')).toBe('password-link');
            expect(elements[1].getAttribute('class')).toBe('btn-link');
            expect(elements[2].getAttribute('id')).toBe('reset-btn');

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with password reset href attributes that will be converted to modal');
        });

        it('should preserve complex HTML structure', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset" class="password-link w-inline-block">
                    <div class="icon"></div>
                    <span>I forgot my password</span>
                </a>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(1);
            const element = document.querySelector('a');
            expect(element?.getAttribute('href')).toBe('#');
            expect(element?.getAttribute('data-ms-modal')).toBe('forgot-password');
            expect(element?.innerHTML).toBe(`
                    <div class="icon"></div>
                    <span>I forgot my password</span>
                `);
        });
    });

    describe('processPasswordResetUrls - edge cases', () => {
        it('should return 0 when no password reset URLs found', () => {
            document.body.innerHTML = `
                <a href="#/ms/login">Login</a>
                <a href="#/ms/signup/123">Signup</a>
                <a href="/pricing">Regular link</a>
                <a href="#other-hash">Other hash</a>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(0);
            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
        });

        it('should not match similar but different URLs', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset-other">Not exact match</a>
                <a href="#/ms/password-reset/">With trailing slash</a>
                <a href="/ms/password-reset">Missing hash</a>
                <a href="#ms/password-reset">Missing slash</a>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(0);
            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
        });

        it('should handle empty document', () => {
            document.body.innerHTML = '';

            const result = processPasswordResetUrls();

            expect(result).toBe(0);
            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
        });

        it('should handle elements in different DOM positions', () => {
            document.body.innerHTML = `
                <div class="header">
                    <a href="#/ms/password-reset" class="header-link">Reset in header</a>
                </div>
                <main>
                    <form class="login-form">
                        <a href="#/ms/password-reset" class="form-link">Reset in form</a>
                    </form>
                </main>
                <footer>
                    <a href="#/ms/password-reset" class="footer-link">Reset in footer</a>
                </footer>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(3);

            const elements = document.querySelectorAll('a[data-ms-modal="forgot-password"]');
            expect(elements).toHaveLength(3);

            elements.forEach(element => {
                expect(element.getAttribute('href')).toBe('#');
                expect(element.getAttribute('data-ms-modal')).toBe('forgot-password');
            });
        });
    });

    describe('processPasswordResetUrls - logging', () => {
        it('should log warning with correct count', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset">Reset 1</a>
                <a href="#/ms/password-reset">Reset 2</a>
                <a href="#/ms/password-reset">Reset 3</a>
                <a href="#/ms/password-reset">Reset 4</a>
                <a href="#/ms/password-reset">Reset 5</a>
            `;

            processPasswordResetUrls();

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 5 elements with password reset href attributes that will be converted to modal');
        });

        it('should not log warning when no elements found', () => {
            document.body.innerHTML = `<a href="/regular">Regular link</a>`;

            processPasswordResetUrls();

            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
        });

        it('should call replacePasswordResetHref logging for each element', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset">Reset 1</a>
                <a href="#/ms/password-reset">Reset 2</a>
            `;

            processPasswordResetUrls();

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 2 elements with password reset href attributes that will be converted to modal');
        });
    });

    describe('processPasswordResetUrls - integration scenarios', () => {
        it('should work with mixed link types on same page', () => {
            document.body.innerHTML = `
                <a href="#/ms/login">Login</a>
                <a href="#/ms/password-reset" class="password-link">I forgot my password</a>
                <a href="#/ms/signup/123">Signup</a>
                <a href="/pricing#/ms/content/members">Content</a>
            `;

            const result = processPasswordResetUrls();

            expect(result).toBe(1);

            // Check that only password reset was transformed
            const passwordResetLink = document.querySelector('a[data-ms-modal="forgot-password"]');
            expect(passwordResetLink).toBeTruthy();
            expect(passwordResetLink?.getAttribute('href')).toBe('#');

            // Check that other links are unchanged
            const loginLink = document.querySelector('a[href="#/ms/login"]');
            const signupLink = document.querySelector('a[href="#/ms/signup/123"]');
            const contentLink = document.querySelector('a[href="/pricing#/ms/content/members"]');

            expect(loginLink).toBeTruthy();
            expect(signupLink).toBeTruthy();
            expect(contentLink).toBeTruthy();
        });

        it('should handle password reset links with various styling', () => {
            document.body.innerHTML = `
                <a href="#/ms/password-reset" class="link-primary">Primary style</a>
                <a href="#/ms/password-reset" class="link-secondary btn">Button style</a>
                <a href="#/ms/password-reset" style="color: blue;">Inline style</a>
                <a href="#/ms/password-reset" data-toggle="modal">With data attributes</a>
            `;

            processPasswordResetUrls();

            const elements = document.querySelectorAll('a[data-ms-modal="forgot-password"]');
            expect(elements).toHaveLength(4);

            expect(elements[0].getAttribute('class')).toBe('link-primary');
            expect(elements[1].getAttribute('class')).toBe('link-secondary btn');
            expect(elements[2].getAttribute('style')).toBe('color: blue;');
            expect(elements[3].getAttribute('data-toggle')).toBe('modal');
        });
    });
});