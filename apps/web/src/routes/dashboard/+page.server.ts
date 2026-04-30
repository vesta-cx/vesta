import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { users } from '@vesta-cx/db';
import { userHandleSchema } from '@vesta-cx/db/entity-schemas';
import { getDb } from '$lib/server/db';
import type { Actions } from './$types';

const stringField = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((value) => (value.length === 0 ? null : value))
		.nullable();

const profileUpdateSchema = z.object({
	handle: userHandleSchema.nullable().or(z.literal('').transform(() => null)),
	displayName: stringField(80),
	bio: stringField(500)
});

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const raw = {
			handle: ((form.get('handle') as string | null) ?? '').trim(),
			displayName: ((form.get('displayName') as string | null) ?? '').trim(),
			bio: ((form.get('bio') as string | null) ?? '').trim()
		};

		const parsed = profileUpdateSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				errors: parsed.error.flatten().fieldErrors
			});
		}

		const db = getDb(platform);
		try {
			await db
				.update(users)
				.set({
					handle: parsed.data.handle,
					displayName: parsed.data.displayName,
					bio: parsed.data.bio,
					updatedAt: new Date()
				})
				.where(eq(users.workosUserId, locals.session.userId));
		} catch (caught) {
			const message = caught instanceof Error ? caught.message : '';
			if (/UNIQUE constraint failed/i.test(message)) {
				return fail(409, {
					values: raw,
					errors: { handle: ['That handle is already taken.'] }
				});
			}
			throw caught;
		}

		return { success: true };
	}
};
