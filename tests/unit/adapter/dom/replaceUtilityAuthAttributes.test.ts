import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    replaceMemberPageAttribute,
    replaceLogoutAttribute,
    replaceForgotPasswordAttribute,
    replaceLoginAttribute,
    replaceSignupAttribute,
    updateAllLogoutAttributes
} from '@dom/replaceUtilityAuthAttributes';
import { logger } from '@utils/logger';

// Mock logger
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

describe('Utility Attributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('data-ms-member="member-page"', () => {
        it('should replace data-ms-member attribute with data-ms-action="login-redirect"', () => {
            const element = document.createElement('a');
            element.setAttribute('data-ms-member', 'member-page');
            element.textContent = 'Dashboard';

            replaceMemberPageAttribute(element);

            expect(element.hasAttribute('data-ms-member')).toBe(false);
            expect(element.getAttribute('data-ms-action')).toBe('login-redirect');
            expect(element.textContent).toBe('Dashboard');
        });
    });

    describe('ms-logout', () => {
        it('should replace ms-logout attribute with data-ms-action="logout"', () => {
            const element = document.createElement('button');
            element.setAttribute('ms-logout', '');

            replaceLogoutAttribute(element);

            expect(element.hasAttribute('ms-logout')).toBe(false);
            expect(element.hasAttribute('data-ms-logout')).toBe(false);
            expect(element.getAttribute('data-ms-action')).toBe('logout');
        });

        it('should replace data-ms-logout attribute with data-ms-action="logout"', () => {
            const element = document.createElement('button');
            element.setAttribute('data-ms-logout', '');

            replaceLogoutAttribute(element);

            expect(element.hasAttribute('data-ms-logout')).toBe(false);
            expect(element.getAttribute('data-ms-action')).toBe('logout');
        });
    });

    describe('ms-forgot', () => {
        it('should replace ms-forgot attribute with data-ms-modal="forgot-password"', () => {
            const element = document.createElement('span');
            element.setAttribute('ms-forgot', '');

            replaceForgotPasswordAttribute(element);

            expect(element.hasAttribute('ms-forgot')).toBe(false);
            expect(element.getAttribute('data-ms-modal')).toBe('forgot-password');
        });
    });

    describe('ms-login', () => {
        it('should replace ms-login attribute with data-ms-modal="login"', () => {
            const element = document.createElement('a');
            element.setAttribute('ms-login', '');

            replaceLoginAttribute(element);

            expect(element.hasAttribute('ms-login')).toBe(false);
            expect(element.getAttribute('data-ms-modal')).toBe('login');
        });
    });

    describe('ms-signup', () => {
        it('should replace ms-signup attribute with data-ms-modal="signup"', () => {
            const element = document.createElement('button');
            element.setAttribute('ms-signup', '');

            replaceSignupAttribute(element);

            expect(element.hasAttribute('ms-signup')).toBe(false);
            expect(element.getAttribute('data-ms-modal')).toBe('signup');
        });
    });

    describe('combined scenarios', () => {
        it('should transform all deprecated attributes', () => {
            document.body.innerHTML = `
                <button data-ms-logout>Logout 1</button>
                <button ms-logout>Logout 2</button>
                <span ms-forgot>Reset Password</span>
                <a ms-login>Login</a>
                <button ms-signup>Sign Up</button>
                <a data-ms-member="member-page">Dashboard</a>
            `;

            updateAllLogoutAttributes();

            // Check data-ms-logout transformation
            const logoutButton1 = document.querySelector('button:first-child') as HTMLElement;
            expect(logoutButton1.getAttribute('data-ms-action')).toBe('logout');
            expect(logoutButton1.hasAttribute('data-ms-logout')).toBe(false);

            // Check ms-logout transformation
            const logoutButton2 = document.querySelector('button:nth-child(2)') as HTMLElement;
            expect(logoutButton2.getAttribute('data-ms-action')).toBe('logout');
            expect(logoutButton2.hasAttribute('ms-logout')).toBe(false);

            // Check ms-forgot transformation
            const forgotSpan = document.querySelector('span') as HTMLElement;
            expect(forgotSpan.getAttribute('data-ms-modal')).toBe('forgot-password');
            expect(forgotSpan.hasAttribute('ms-forgot')).toBe(false);

            // Check ms-login transformation
            const loginLink = document.querySelector('a:first-of-type') as HTMLElement;
            expect(loginLink.getAttribute('data-ms-modal')).toBe('login');
            expect(loginLink.hasAttribute('ms-login')).toBe(false);

            // Check ms-signup transformation
            const signupButton = document.querySelector('button:last-of-type') as HTMLElement;
            expect(signupButton.getAttribute('data-ms-modal')).toBe('signup');
            expect(signupButton.hasAttribute('ms-signup')).toBe(false);

            // Check data-ms-member transformation
            const memberLink = document.querySelector('a:last-of-type') as HTMLElement;
            expect(memberLink.getAttribute('data-ms-action')).toBe('login-redirect');
            expect(memberLink.hasAttribute('data-ms-member')).toBe(false);
        });

        it('should preserve element content and other attributes', () => {
            document.body.innerHTML = `
                <a data-ms-member="member-page" class="btn" id="dashboard-link" title="Go to dashboard">My Dashboard</a>
            `;

            updateAllLogoutAttributes();

            const link = document.querySelector('a') as HTMLElement;
            expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
            expect(link.hasAttribute('data-ms-member')).toBe(false);
            expect(link.className).toBe('btn');
            expect(link.id).toBe('dashboard-link');
            expect(link.title).toBe('Go to dashboard');
            expect(link.textContent).toBe('My Dashboard');
        });

        it('should handle multiple elements of same type', () => {
            document.body.innerHTML = `
                <a data-ms-member="member-page">Dashboard 1</a>
                <button data-ms-member="member-page">Dashboard 2</button>
                <div data-ms-member="member-page">Dashboard 3</div>
            `;

            updateAllLogoutAttributes();

            const elements = document.querySelectorAll('[data-ms-action="login-redirect"]');
            expect(elements).toHaveLength(3);

            elements.forEach(el => {
                expect(el.hasAttribute('data-ms-member')).toBe(false);
                expect(el.getAttribute('data-ms-action')).toBe('login-redirect');
            });

            expect(logger).toHaveBeenCalledWith('warn', 'Found 3 elements with deprecated data-ms-member="member-page" attribute');
        });

        it('should only transform data-ms-member with value "member-page"', () => {
            document.body.innerHTML = `
                <a data-ms-member="member-page">Should transform</a>
                <a data-ms-member="other-page">Should not transform</a>
                <a data-ms-member="">Should not transform</a>
            `;

            updateAllLogoutAttributes();

            const transformedElements = document.querySelectorAll('[data-ms-action="login-redirect"]');
            expect(transformedElements).toHaveLength(1);
            expect(transformedElements[0].textContent).toBe('Should transform');

            const untransformedElements = document.querySelectorAll('[data-ms-member]');
            expect(untransformedElements).toHaveLength(2);
        });
    });
});