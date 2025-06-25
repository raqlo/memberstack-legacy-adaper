import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformMembershipRedirectLinks } from '@dom/hashUrlToMsActionTransformer';

// Mock logger
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

describe('membershipRedirectLinks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('transformMembershipRedirectLinks', () => {
        it('should transform single membership redirect link', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="bold">Login</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(1);

            const link = document.querySelector('a') as HTMLAnchorElement;
            expect(link.getAttribute('href')).toBe('#'); // Use getAttribute
            expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
            expect(link.className).toBe('bold'); // Should preserve other attributes
            expect(link.textContent).toBe('Login'); // Should preserve content
        });

        it('should transform multiple membership redirect links', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="bold">Login</a>
                <a href="#/ms/membership/redirect" id="login-btn">Sign In</a>
                <a href="#/ms/membership/redirect">Access</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(3);

            const links = document.querySelectorAll('a');
            links.forEach(link => {
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
            });

            // Check that other attributes are preserved
            expect(links[0].className).toBe('bold');
            expect(links[1].id).toBe('login-btn');
        });

        it('should not transform other links', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="bold">Should transform</a>
                <a href="#" class="other">Should not transform</a>
                <a href="/login">Should not transform</a>
                <a href="#/ms/other/redirect">Should not transform</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(1);

            const transformedLink = document.querySelector('a[data-ms-action="login-redirect"]');
            expect(transformedLink?.textContent).toBe('Should transform');

            const otherLinks = document.querySelectorAll('a:not([data-ms-action="login-redirect"])') as NodeListOf<HTMLAnchorElement>;
            expect(otherLinks).toHaveLength(3);
            expect(otherLinks[0].getAttribute('href')).toBe('#');
            expect(otherLinks[1].getAttribute('href')).toBe('/login');
            expect(otherLinks[2].getAttribute('href')).toBe('#/ms/other/redirect');
        });

        it('should return 0 when no membership redirect links found', () => {
            document.body.innerHTML = `
                <a href="#">Normal link</a>
                <a href="/page">Page link</a>
                <div>Not a link</div>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(0);
        });

        it('should handle links with complex attributes', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" 
                   class="btn btn-primary" 
                   id="main-login" 
                   data-custom="value"
                   title="Login to access">
                    <span class="icon"></span>Login Here
                </a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(1);

            const link = document.querySelector('a') as HTMLAnchorElement;
            expect(link.getAttribute('href')).toBe('#'); // Use getAttribute
            expect(link.getAttribute('data-ms-action')).toBe('login-redirect');

            // Check that all other attributes are preserved
            expect(link.className).toBe('btn btn-primary');
            expect(link.id).toBe('main-login');
            expect(link.getAttribute('data-custom')).toBe('value');
            expect(link.title).toBe('Login to access');
            expect(link.innerHTML.trim()).toBe('<span class="icon"></span>Login Here');
        });

        it('should log transformation details', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="bold">Login</a>
                <a href="#/ms/membership/redirect">Sign In</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(2);
        });

        it('should handle edge cases with empty document', () => {
            // Document is already empty from beforeEach
            const result = transformMembershipRedirectLinks();

            expect(result).toBe(0);
        });
    });
});