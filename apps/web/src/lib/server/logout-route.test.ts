/** @format */

import { describe, expect, it } from 'vitest';
import * as route from '../../routes/auth/logout/+server.js';

describe('web auth logout route', () => {
	it('only exposes POST', () => {
		expect(route.POST).toBeTypeOf('function');
		expect('GET' in route).toBe(false);
	});
});
