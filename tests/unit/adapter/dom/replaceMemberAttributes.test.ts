import { describe, it, expect, beforeEach, vi } from 'vitest';

import {updateRewriteAttributes} from "@dom/replaceMemberAttributes";
import {isMemberAuthV2} from "../../../../src/utils/sessions";
import {logger} from "@utils/logger";
import {updateLoginUrlsToProfile} from "../../../../src/adapter/dom/replaceMemberAttributes";

vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

vi.mock('@utils/sessions', () => ({
    getCurrentMemberV2: vi.fn(),
    isMemberAuthV2: vi.fn()
}));

// Shared test utilities
const setupAuthenticatedMember = () => {
    vi.mocked(isMemberAuthV2).mockReturnValue(true);
};

const setupUnauthenticatedMember = () => {
    vi.mocked(isMemberAuthV2).mockReturnValue(false);
};

const setupTest = () => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
};


describe('updateRewriteAttributes', () => {
    beforeEach(setupTest);

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

describe('updateLoginUrlsToProfile', () => {
    const testLoginUrl = '/login';

    beforeEach(setupTest);

    it('should call warn when login URLs are found and member is authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login">Login</a>
            <a href="/login">Sign In</a>
        `;

        updateLoginUrlsToProfile(testLoginUrl);

        expect(logger).toHaveBeenCalledWith('warn', expect.stringContaining('2 elements with login URL that need profile URL update'));
    });

    it('should not call warn when no login URLs exist and member is authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/home">Home</a>
            <a href="/about">About</a>
        `;

        updateLoginUrlsToProfile(testLoginUrl);

        expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with login URL'));
    });

    it('should not process login URLs when member is not authenticated', () => {
        setupUnauthenticatedMember();

        document.body.innerHTML = `
            <a href="/login">Login</a>
        `;

        updateLoginUrlsToProfile(testLoginUrl);

        // Should not call warn about login URLs since processing was skipped
        expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with login URL'));
        expect(logger).toHaveBeenCalledWith('debug', expect.stringContaining('Member not authenticated'));
    });

    it('should update login URLs to profile URL when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login">Login</a>
        `;

        const linkElement = document.querySelector('a[href="/login"]') as HTMLAnchorElement;
        expect(linkElement.href).toContain('/login');

        updateLoginUrlsToProfile(testLoginUrl);

        expect(linkElement.href).toContain('/profile-page');
    });

    it('should handle multiple login URL elements when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login">Login</a>
            <a href="/login">Sign In</a>
            <a href="/login">Member Access</a>
        `;

        updateLoginUrlsToProfile(testLoginUrl);

        const linkElements = document.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
        linkElements.forEach(link => {
            expect(link.href).toContain('/profile-page');
        });
    });

    it('should only update exact URL matches when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login">Login</a>
            <a href="/login-page">Login Page</a>
            <a href="/user/login">User Login</a>
        `;

        updateLoginUrlsToProfile('/login');

        const loginLink = document.querySelector('a[href="/profile-page"]') as HTMLAnchorElement;
        const loginPageLink = document.querySelector('a[href="/login-page"]') as HTMLAnchorElement;
        const userLoginLink = document.querySelector('a[href="/user/login"]') as HTMLAnchorElement;

        expect(loginLink).toBeTruthy(); // Should be updated to profile-page
        expect(loginPageLink).toBeTruthy(); // Should remain unchanged
        expect(userLoginLink).toBeTruthy(); // Should remain unchanged
    });

    it('should handle different login URL patterns when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="https://example.com/auth/login">Login</a>
        `;

        updateLoginUrlsToProfile('https://example.com/auth/login');

        const linkElement = document.querySelector('a') as HTMLAnchorElement;
        expect(linkElement.href).toContain('/profile-page');
    });

    it('should handle empty document when authenticated', () => {
        setupAuthenticatedMember();

        updateLoginUrlsToProfile(testLoginUrl);

        expect(logger).not.toHaveBeenCalledWith('warn', expect.stringContaining('elements with login URL'));
        expect(logger).toHaveBeenCalledWith('debug', expect.stringContaining('No elements with login URL'));
    });

    it('should preserve other link attributes when updating URL', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login" class="btn btn-primary" data-custom="value">Login</a>
        `;

        const linkElement = document.querySelector('a') as HTMLAnchorElement;

        updateLoginUrlsToProfile('/login');

        expect(linkElement.href).toContain('/profile-page');
        expect(linkElement.className).toBe('btn btn-primary');
        expect(linkElement.getAttribute('data-custom')).toBe('value');
    });
});


describe('updateLoginUrlsToProfile and updateRewriteAttributes integration', () => {
    const testLoginUrl = '/login';

    beforeEach(setupTest);

    it('should update both href and text content when element has both login URL and rewrite attribute', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login" data-ms-rewrite="Go to Profile">Login</a>
        `;

        const linkElement = document.querySelector('a') as HTMLAnchorElement;

        // Initial state
        expect(linkElement.href).toContain('/login');
        expect(linkElement.textContent).toBe('Login');

        // Update both attributes
        updateLoginUrlsToProfile(testLoginUrl);
        updateRewriteAttributes();

        // Both should be updated
        expect(linkElement.href).toContain('/profile-page');
        expect(linkElement.textContent).toBe('Go to Profile');
    });

    it('should handle multiple elements with both attributes when authenticated', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login" data-ms-rewrite="My Dashboard">Login</a>
            <a href="/login" data-ms-rewrite="Profile Settings">Account</a>
            <a href="/other-page" data-ms-rewrite="Member Content">Other Link</a>
        `;

        updateLoginUrlsToProfile(testLoginUrl);
        updateRewriteAttributes();

        const links = document.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;

        // First link: both href and text updated
        expect(links[0].href).toContain('/profile-page');
        expect(links[0].textContent).toBe('My Dashboard');

        // Second link: both href and text updated
        expect(links[1].href).toContain('/profile-page');
        expect(links[1].textContent).toBe('Profile Settings');

        // Third link: only text updated (href doesn't match login URL)
        expect(links[2].href).toContain('/other-page');
        expect(links[2].textContent).toBe('Member Content');
    });

    it('should not update anything when member is not authenticated', () => {
        setupUnauthenticatedMember();

        document.body.innerHTML = `
            <a href="/login" data-ms-rewrite="Go to Profile">Login</a>
        `;

        const linkElement = document.querySelector('a') as HTMLAnchorElement;

        // Store initial state
        const initialHref = linkElement.href;
        const initialText = linkElement.textContent;

        updateLoginUrlsToProfile(testLoginUrl);
        updateRewriteAttributes();

        // Nothing should change when not authenticated
        expect(linkElement.href).toBe(initialHref);
        expect(linkElement.textContent).toBe(initialText);
    });

    it('should preserve other attributes when updating both href and text', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a 
                href="/login" 
                data-ms-rewrite="Dashboard" 
                class="btn btn-primary" 
                data-custom="value"
                target="_blank"
            >Login</a>
        `;

        const linkElement = document.querySelector('a') as HTMLAnchorElement;

        updateLoginUrlsToProfile(testLoginUrl);
        updateRewriteAttributes();

        // Updated attributes
        expect(linkElement.href).toContain('/profile-page');
        expect(linkElement.textContent).toBe('Dashboard');

        // Preserved attributes
        expect(linkElement.className).toBe('btn btn-primary');
        expect(linkElement.getAttribute('data-custom')).toBe('value');
        expect(linkElement.getAttribute('target')).toBe('_blank');
        expect(linkElement.getAttribute('data-ms-rewrite')).toBe('Dashboard');
    });

    it('should handle mixed scenarios with some elements having both attributes', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login" data-ms-rewrite="Profile">Login Link</a>
            <a href="/login">Simple Login</a>
            <span data-ms-rewrite="Welcome Back">Hello</span>
            <a href="/other-page" data-ms-rewrite="Member Area">Other</a>
        `;

        updateLoginUrlsToProfile(testLoginUrl);
        updateRewriteAttributes();

        const elements = document.querySelectorAll('a, span');

        // First link: both updated
        expect((elements[0] as HTMLAnchorElement).href).toContain('/profile-page');
        expect(elements[0].textContent).toBe('Profile');

        // Second link: only href updated
        expect((elements[1] as HTMLAnchorElement).href).toContain('/profile-page');
        expect(elements[1].textContent).toBe('Simple Login');

        // Span: only text updated
        expect(elements[2].textContent).toBe('Welcome Back');

        // Fourth link: only text updated (href doesn't match)
        expect((elements[3] as HTMLAnchorElement).href).toContain('/other-page');
        expect(elements[3].textContent).toBe('Member Area');
    });

    it('should handle empty rewrite value but still update href', () => {
        setupAuthenticatedMember();

        document.body.innerHTML = `
            <a href="/login" data-ms-rewrite="">Login</a>
        `;

        const linkElement = document.querySelector('a') as HTMLAnchorElement;

        updateLoginUrlsToProfile(testLoginUrl);
        updateRewriteAttributes();

        // Href should be updated, text should remain unchanged due to empty rewrite
        expect(linkElement.href).toContain('/profile-page');
        expect(linkElement.textContent).toBe('Login');
    });
});
