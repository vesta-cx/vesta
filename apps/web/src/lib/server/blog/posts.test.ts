import { describe, expect, it } from 'vitest';
import { loadPost, loadProfile } from './posts';

describe('music blog fixtures', () => {
	it('resolves a release as a post with destinations for its publisher, credits and related posts', () => {
		const page = loadPost('shellac-notes', 'west-end-blues');

		expect(page?.release?.format).toBe('Single');
		expect(loadProfile('shellac-notes')?.posts).toContainEqual(page?.post);
		expect(page?.release?.platforms.length).toBeGreaterThan(0);
		expect(page?.release?.press.length).toBeGreaterThan(0);
		for (const credit of page?.release?.credits ?? []) {
			expect(loadProfile(credit.profile.slug)?.releases).toContainEqual(page?.post);
		}
		for (const post of page?.release?.related ?? []) {
			expect(loadPost(post.profile, post.slug)).toMatchObject({ post, release: null });
		}
	});

	it('does not serve a post under a profile that did not publish it', () => {
		expect(loadPost('earl-hines', 'west-end-blues')).toBeUndefined();
		expect(loadPost('shellac-notes', 'missing')).toBeUndefined();
		expect(loadProfile('missing')).toBeUndefined();
	});
});
