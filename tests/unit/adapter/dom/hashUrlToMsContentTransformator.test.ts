import { describe, it, expect, vi, beforeEach } from 'vitest';
import { replaceContentHref, processContentUrls } from '@dom/hashUrlToMsContentTransformator';
import { logger } from '@utils/logger';

// Mock logger
vi.mock('@utils/logger', () => ({
    logger: vi.fn()
}));

describe('contentUrlTransform', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('replaceContentHref', () => {
        it('should replace href and add data-ms-content attribute', () => {
            const element = document.createElement('a');
            element.setAttribute('href', '/pricing#/ms/content/members');
            document.body.appendChild(element);

            replaceContentHref(element, '/pricing', 'members');

            expect(element.getAttribute('href')).toBe('/pricing');
            expect(element.getAttribute('data-ms-content')).toBe('members');
            expect(logger).toHaveBeenCalledWith('debug', '[Adapter] Replacing content href for type: members');
            expect(logger).toHaveBeenCalledWith('debug', '[Adapter] Successfully replaced content href: /pricing#/ms/content/members -> /pricing with data-ms-content="members"');
        });

        it('should handle special characters in content type', () => {
            const element = document.createElement('a');
            element.setAttribute('href', '/pricing#/ms/content/!paid');
            document.body.appendChild(element);

            replaceContentHref(element, '/pricing', '!paid');

            expect(element.getAttribute('href')).toBe('/pricing');
            expect(element.getAttribute('data-ms-content')).toBe('!paid');
            expect(logger).toHaveBeenCalledWith('debug', '[Adapter] Replacing content href for type: !paid');
        });

        it('should handle complex content types', () => {
            const element = document.createElement('a');
            element.setAttribute('href', '/dashboard#/ms/content/premium-tier-1');
            document.body.appendChild(element);

            replaceContentHref(element, '/dashboard', 'premium-tier-1');

            expect(element.getAttribute('href')).toBe('/dashboard');
            expect(element.getAttribute('data-ms-content')).toBe('premium-tier-1');
            expect(logger).toHaveBeenCalledWith('debug', '[Adapter] Replacing content href for type: premium-tier-1');
        });
    });

    describe('processContentUrls - basic functionality', () => {
        it('should transform simple content URL', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/members">Member Content</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(1);
            const element = document.querySelector('a');
            expect(element?.getAttribute('href')).toBe('/pricing');
            expect(element?.getAttribute('data-ms-content')).toBe('members');
            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 1 elements with content href attributes that will be converted to data-ms-content');
        });

        it('should handle multiple content URLs', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/members">Member Content</a>
                <a href="/dashboard#/ms/content/premium">Premium Content</a>
                <a href="/app#/ms/content/basic">Basic Content</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(3);

            const elements = document.querySelectorAll('a');
            expect(elements[0].getAttribute('href')).toBe('/pricing');
            expect(elements[0].getAttribute('data-ms-content')).toBe('members');

            expect(elements[1].getAttribute('href')).toBe('/dashboard');
            expect(elements[1].getAttribute('data-ms-content')).toBe('premium');

            expect(elements[2].getAttribute('href')).toBe('/app');
            expect(elements[2].getAttribute('data-ms-content')).toBe('basic');

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with content href attributes that will be converted to data-ms-content');
        });

        it('should preserve existing classes and attributes', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/members" class="link-block w-inline-block" data-custom="value">
                    <p>You are logged in - hidden link</p>
                </a>
            `;

            const result = processContentUrls();

            expect(result).toBe(1);
            const element = document.querySelector('a');
            expect(element?.getAttribute('href')).toBe('/pricing');
            expect(element?.getAttribute('data-ms-content')).toBe('members');
            expect(element?.getAttribute('class')).toBe('link-block w-inline-block');
            expect(element?.getAttribute('data-custom')).toBe('value');
            expect(element?.innerHTML).toContain('<p>You are logged in - hidden link</p>');
        });
    });

    describe('processContentUrls - special characters and formats', () => {
        it('should handle negation content types', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/!paid">I am NOT paid content</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(1);
            const element = document.querySelector('a');
            expect(element?.getAttribute('href')).toBe('/pricing');
            expect(element?.getAttribute('data-ms-content')).toBe('!paid');
        });

        it('should handle various special characters', () => {
            document.body.innerHTML = `
                <a href="/app#/ms/content/@premium">Premium with @</a>
                <a href="/dashboard#/ms/content/tier_1">Underscore tier</a>
                <a href="/content#/ms/content/beta-test">Dash separated</a>
                <a href="/member#/ms/content/level+1">Plus sign</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(4);

            const elements = document.querySelectorAll('a');
            expect(elements[0].getAttribute('data-ms-content')).toBe('@premium');
            expect(elements[1].getAttribute('data-ms-content')).toBe('tier_1');
            expect(elements[2].getAttribute('data-ms-content')).toBe('beta-test');
            expect(elements[3].getAttribute('data-ms-content')).toBe('level+1');
        });

        it('should handle complex base URLs', () => {
            document.body.innerHTML = `
                <a href="/complex/path/to/page#/ms/content/members">Complex path</a>
                <a href="/page?param=value#/ms/content/premium">With query params</a>
                <a href="https://example.com/page#/ms/content/basic">Full URL</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(3);

            const elements = document.querySelectorAll('a');
            expect(elements[0].getAttribute('href')).toBe('/complex/path/to/page');
            expect(elements[1].getAttribute('href')).toBe('/page?param=value');
            expect(elements[2].getAttribute('href')).toBe('https://example.com/page');
        });
    });

    describe('processContentUrls - edge cases and error handling', () => {
        it('should return 0 when no content URLs found', () => {
            document.body.innerHTML = `
                <a href="/pricing">Regular link</a>
                <a href="#/ms/signup/123">Signup link</a>
                <a href="/content#other">Other hash</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(0);
            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
        });

        it('should handle malformed URLs and log errors', () => {
            document.body.innerHTML = `
                <a href="#/ms/content/">Empty content type</a>
                <a href="/ms/content/members">Missing hash</a>
            `;

            const result = processContentUrls();

            // Only the first one matches the selector but fails regex
            expect(result).toBe(1);
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] Failed to extract content info from href: #/ms/content/');
        });

        it('should handle elements without href attribute', () => {
            const element = document.createElement('a');
            element.textContent = 'No href';
            document.body.appendChild(element);

            // This won't be selected by the querySelector since it doesn't have href*="#/ms/content/"
            const result = processContentUrls();

            expect(result).toBe(0);
        });

        it('should handle mixed valid and invalid URLs', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/members">Valid</a>
                <a href="#/ms/content/">Invalid - empty</a>
                <a href="/dashboard#/ms/content/premium">Valid</a>
            `;

            const result = processContentUrls();

            expect(result).toBe(3);

            // Check that valid ones were processed
            const elements = document.querySelectorAll('a');
            expect(elements[0].getAttribute('data-ms-content')).toBe('members');
            expect(elements[2].getAttribute('data-ms-content')).toBe('premium');

            // Check that error was logged for invalid one
            expect(logger).toHaveBeenCalledWith('error', '[Adapter] Failed to extract content info from href: #/ms/content/');
        });
    });

    describe('processContentUrls - logging', () => {
        it('should log debug message when starting process', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/members">Member Content</a>
            `;

            processContentUrls();

            expect(logger).toHaveBeenCalledWith('debug', '[Adapter] Processing content URLs');
        });

        it('should log warning with correct count', () => {
            document.body.innerHTML = `
                <a href="/pricing#/ms/content/members">Member 1</a>
                <a href="/dashboard#/ms/content/premium">Member 2</a>
                <a href="/app#/ms/content/basic">Member 3</a>
            `;

            processContentUrls();

            expect(logger).toHaveBeenCalledWith('warn', '[Adapter] Found 3 elements with content href attributes that will be converted to data-ms-content');
        });

        it('should not log warning when no elements found', () => {
            document.body.innerHTML = `<a href="/regular">Regular link</a>`;

            processContentUrls();

            expect(logger).not.toHaveBeenCalledWith(expect.stringMatching(/warn/), expect.anything());
            expect(logger).toHaveBeenCalledWith('debug', '[Adapter] Processing content URLs');
        });
    });
});