/** @format */

import { describe, expect, it } from 'vitest';
import * as route from '../../routes/(app)/auth/logout/+server.js';

describe('sona auth logout route', () => {
	it('only exposes POST', () => {
		expect(route.POST).toBeTypeOf('function');
		expect('GET' in route).toBe(false);
	});
});
