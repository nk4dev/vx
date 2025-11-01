/**
 * @jest-environment node
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('VX CLI - Basic Tests', () => {
    test('sample test should pass', () => {
        expect(true).toBe(true);
    });

    test('can import config module', async () => {
        const config = await import('./src/config.js');
        expect(config).toBeDefined();
    });
});