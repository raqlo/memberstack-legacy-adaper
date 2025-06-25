import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformMembershipRedirectLinks } from '@dom/hashUrlToMsActionTransformer';
import { logger } from '@utils/logger';

// Mock logger
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

describe('Hash URLs to data-ms-action attributes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('login redirect transformations', () => {
        describe('#/ms/membership/redirect', () => {
            it('should transform single membership redirect link', () => {
                document.body.innerHTML = `
                    <a href="#/ms/membership/redirect" class="bold">Login</a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(1);

                const link = document.querySelector('a') as HTMLAnchorElement;
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
                expect(link.className).toBe('bold');
                expect(link.textContent).toBe('Login');
            });

            it('should transform multiple membership redirect links', () => {
                document.body.innerHTML = `
                    <a href="#/ms/membership/redirect" class="bold">Login</a>
                    <a href="#/ms/membership/redirect" id="login-btn">Sign In</a>
                    <a href="#/ms/membership/redirect">Access</a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(3);

                const links = document.querySelectorAll('a[data-ms-action="login-redirect"]');
                expect(links).toHaveLength(3);

                links.forEach(link => {
                    expect(link.getAttribute('href')).toBe('#');
                    expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
                });

                expect(links[0].className).toBe('bold');
                expect((links[1] as HTMLElement).id).toBe('login-btn');
            });

            it('should handle membership redirect links with complex attributes', () => {
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
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
                expect(link.className).toBe('btn btn-primary');
                expect(link.id).toBe('main-login');
                expect(link.getAttribute('data-custom')).toBe('value');
                expect(link.title).toBe('Login to access');
                expect(link.innerHTML.trim()).toBe('<span class="icon"></span>Login Here');
            });
        });

        describe('#/ms/member-page/default', () => {
            it('should transform single member-page default link', () => {
                document.body.innerHTML = `
                    <a href="#/ms/member-page/default" class="dashboard">Dashboard</a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(1);

                const link = document.querySelector('a') as HTMLAnchorElement;
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
                expect(link.className).toBe('dashboard');
                expect(link.textContent).toBe('Dashboard');
            });

            it('should transform multiple member-page default links', () => {
                document.body.innerHTML = `
                    <a href="#/ms/member-page/default" class="nav-link">Member Area</a>
                    <a href="#/ms/member-page/default" id="member-btn">My Account</a>
                    <a href="#/ms/member-page/default">Profile</a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(3);

                const links = document.querySelectorAll('a[data-ms-action="login-redirect"]');
                expect(links).toHaveLength(3);

                links.forEach(link => {
                    expect(link.getAttribute('href')).toBe('#');
                    expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
                });

                expect(links[0].className).toBe('nav-link');
                expect((links[1] as HTMLElement).id).toBe('member-btn');
            });

            it('should handle member-page links with complex attributes', () => {
                document.body.innerHTML = `
                    <a href="#/ms/member-page/default" 
                       class="btn btn-secondary" 
                       id="member-dashboard" 
                       data-role="member"
                       title="Access member dashboard">
                        <i class="dashboard-icon"></i>My Dashboard
                    </a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(1);

                const link = document.querySelector('a') as HTMLAnchorElement;
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
                expect(link.className).toBe('btn btn-secondary');
                expect(link.id).toBe('member-dashboard');
                expect(link.getAttribute('data-role')).toBe('member');
                expect(link.title).toBe('Access member dashboard');
                expect(link.innerHTML.trim()).toBe('<i class="dashboard-icon"></i>My Dashboard');
            });
        });

        it('should transform both types of login redirect links together', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="login-btn">Login</a>
                <a href="#/ms/member-page/default" class="dashboard-btn">Dashboard</a>
                <a href="#/ms/membership/redirect" id="secondary-login">Sign In</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(3);

            const transformedLinks = document.querySelectorAll('a[data-ms-action="login-redirect"]');
            expect(transformedLinks).toHaveLength(3);

            transformedLinks.forEach(link => {
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('login-redirect');
            });
        });
    });

    describe('logout transformations', () => {
        describe('#/ms/logout', () => {
            it('should transform single logout link', () => {
                document.body.innerHTML = `
                    <a href="#/ms/logout" class="logout-btn">Logout</a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(1);

                const link = document.querySelector('a') as HTMLAnchorElement;
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('logout');
                expect(link.className).toBe('logout-btn');
                expect(link.textContent).toBe('Logout');
            });

            it('should transform multiple logout links', () => {
                document.body.innerHTML = `
                    <a href="#/ms/logout" class="nav-logout">Logout</a>
                    <a href="#/ms/logout" id="header-logout">Sign Out</a>
                    <a href="#/ms/logout">Exit</a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(3);

                const links = document.querySelectorAll('a[data-ms-action="logout"]');
                expect(links).toHaveLength(3);

                links.forEach(link => {
                    expect(link.getAttribute('href')).toBe('#');
                    expect(link.getAttribute('data-ms-action')).toBe('logout');
                });

                expect(links[0].className).toBe('nav-logout');
                expect((links[1] as HTMLElement).id).toBe('header-logout');
            });

            it('should handle logout links with complex attributes', () => {
                document.body.innerHTML = `
                    <a href="#/ms/logout" 
                       class="btn btn-danger" 
                       id="main-logout" 
                       data-confirm="true"
                       title="Sign out of account">
                        <i class="logout-icon"></i>Sign Out
                    </a>
                `;

                const result = transformMembershipRedirectLinks();

                expect(result).toBe(1);

                const link = document.querySelector('a') as HTMLAnchorElement;
                expect(link.getAttribute('href')).toBe('#');
                expect(link.getAttribute('data-ms-action')).toBe('logout');
                expect(link.className).toBe('btn btn-danger');
                expect(link.id).toBe('main-logout');
                expect(link.getAttribute('data-confirm')).toBe('true');
                expect(link.title).toBe('Sign out of account');
                expect(link.innerHTML.trim()).toBe('<i class="logout-icon"></i>Sign Out');
            });
        });
    });

    describe('mixed transformations', () => {
        it('should transform all types of links together', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="login-btn">Login</a>
                <a href="#/ms/member-page/default" class="dashboard-btn">Dashboard</a>
                <a href="#/ms/logout" class="logout-btn">Logout</a>
                <a href="#/other/link">Should not transform</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(3);

            const loginRedirectLinks = document.querySelectorAll('a[data-ms-action="login-redirect"]');
            expect(loginRedirectLinks).toHaveLength(2);

            const logoutLinks = document.querySelectorAll('a[data-ms-action="logout"]');
            expect(logoutLinks).toHaveLength(1);

            const untransformedLinks = document.querySelectorAll('a:not([data-ms-action])');
            expect(untransformedLinks).toHaveLength(1);
            expect(untransformedLinks[0].getAttribute('href')).toBe('#/other/link');
        });

        it('should handle complex mixed scenario with various attributes', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" id="login" class="btn primary">Login</a>
                <a href="#/ms/member-page/default" id="dashboard" class="btn secondary">Dashboard</a>
                <a href="#/ms/logout" id="logout" class="btn danger">Logout</a>
                <a href="#/ms/membership/redirect" data-analytics="login-click">Sign In</a>
                <a href="#/ms/logout" data-analytics="logout-click">Sign Out</a>
                <a href="/regular-page">Regular Link</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(5);

            // Verify all transformed links have correct href
            const allTransformedLinks = document.querySelectorAll('a[data-ms-action]');
            allTransformedLinks.forEach(link => {
                expect(link.getAttribute('href')).toBe('#');
            });

            // Verify correct action assignments
            expect(document.querySelectorAll('a[data-ms-action="login-redirect"]')).toHaveLength(3);
            expect(document.querySelectorAll('a[data-ms-action="logout"]')).toHaveLength(2);

            // Verify attributes are preserved
            expect(document.getElementById('login')?.className).toBe('btn primary');
            expect(document.getElementById('dashboard')?.className).toBe('btn secondary');
            expect(document.getElementById('logout')?.className).toBe('btn danger');
            expect(document.querySelector('[data-analytics="login-click"]')).toBeTruthy();
            expect(document.querySelector('[data-analytics="logout-click"]')).toBeTruthy();

            // Check untransformed link
            const untransformedLinks = document.querySelectorAll('a:not([data-ms-action])');
            expect(untransformedLinks).toHaveLength(1);
            expect(untransformedLinks[0].getAttribute('href')).toBe('/regular-page');
        });
    });

    describe('edge cases and error conditions', () => {
        it('should not transform similar but different URLs', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect" class="valid">Should transform</a>
                <a href="#/ms/membership/redirect/extra">Should not transform</a>
                <a href="#/ms/member-page/default" class="valid">Should transform</a>
                <a href="#/ms/member-page/profile">Should not transform</a>
                <a href="#/ms/logout" class="valid">Should transform</a>
                <a href="#/ms/logout/confirm">Should not transform</a>
                <a href="#/ms/member/default">Should not transform</a>
                <a href="#/other/logout">Should not transform</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(3);

            const transformedLinks = document.querySelectorAll('a[data-ms-action]');
            expect(transformedLinks).toHaveLength(3);

            const untransformedLinks = document.querySelectorAll('a:not([data-ms-action])');
            expect(untransformedLinks).toHaveLength(5);
        });

        it('should return 0 when no membership links found', () => {
            document.body.innerHTML = `
                <a href="#">Normal link</a>
                <a href="/page">Page link</a>
                <div>Not a link</div>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(0);
            expect(document.querySelectorAll('a[data-ms-action]')).toHaveLength(0);
        });

        it('should handle empty document', () => {
            const result = transformMembershipRedirectLinks();

            expect(result).toBe(0);
        });

        it('should handle links without href attribute', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect">Valid link</a>
                <a>Link without href</a>
                <a href="">Empty href</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(1);
            expect(document.querySelectorAll('a[data-ms-action]')).toHaveLength(1);
        });

        it('should preserve existing data-ms-action attributes on other elements', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect">Should transform</a>
                <button data-ms-action="existing-action">Should not change</button>
                <a href="#/ms/logout">Should transform</a>
            `;

            const result = transformMembershipRedirectLinks();

            expect(result).toBe(2);

            const button = document.querySelector('button');
            expect(button?.getAttribute('data-ms-action')).toBe('existing-action');

            expect(document.querySelectorAll('a[data-ms-action="login-redirect"]')).toHaveLength(1);
            expect(document.querySelectorAll('a[data-ms-action="logout"]')).toHaveLength(1);
        });
    });

    describe('logging behavior', () => {
        it('should log when transforming login redirect links', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect">Login</a>
                <a href="#/ms/member-page/default">Dashboard</a>
            `;

            transformMembershipRedirectLinks();

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] [Deprecated URL] Found 1 membership redirect links to transform');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] [Deprecated URL] Found 1 member page redirect links to transform');
        });

        it('should log when transforming logout links', () => {
            document.body.innerHTML = `
                <a href="#/ms/logout">Logout</a>
                <a href="#/ms/logout">Sign Out</a>
            `;

            transformMembershipRedirectLinks();

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] [Deprecated URL] Found 2 logout links to transform');
            expect(logger).toHaveBeenCalledWith('info', '[Adapter] Logout links transformation completed. Transformed 2 links');
        });

        it('should log completion summary', () => {
            document.body.innerHTML = `
                <a href="#/ms/membership/redirect">Login</a>
                <a href="#/ms/logout">Logout</a>
            `;

            transformMembershipRedirectLinks();

            expect(logger).toHaveBeenCalledWith('info', '[Adapter] All membership links transformation completed. Total transformed: 2 links');
        });
    });
});