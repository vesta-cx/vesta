import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { Result, Schema } from 'effect';
import { users } from '@vesta-cx/db';
import {
	RESERVED_HANDLES,
	USER_HANDLE_MAX_LENGTH,
	USER_HANDLE_MIN_LENGTH,
	USER_HANDLE_PATTERN
} from '@vesta-cx/db/entity-schemas';
import { getDb } from '$lib/server/db';
import type { Actions } from './$types';

/**
 * Form-side validation schemas. We re-validate at the edge (don't trust the
 * client) and surface field-keyed messages for the dialog form.
 */
const HandleSchema = Schema.NullOr(
	Schema.String.check(
		Schema.makeFilter(
			(value: string) =>
				value.length >= USER_HANDLE_MIN_LENGTH ||
				`Use at least ${USER_HANDLE_MIN_LENGTH} characters.`
		),
		Schema.makeFilter(
			(value: string) =>
				value.length <= USER_HANDLE_MAX_LENGTH ||
				`Use ${USER_HANDLE_MAX_LENGTH} characters or fewer.`
		),
		Schema.makeFilter(
			(value: string) =>
				USER_HANDLE_PATTERN.test(value) ||
				'Use lowercase letters, numbers, hyphens, or underscores.'
		),
		Schema.makeFilter((value: string) => !RESERVED_HANDLES.has(value) || 'That handle is reserved.')
	)
);

const DisplayNameSchema = Schema.NullOr(
	Schema.String.check(
		Schema.makeFilter(
			(value: string) => value.length <= 80 || 'Keep your display name under 80 characters.'
		)
	)
);

const BioSchema = Schema.NullOr(
	Schema.String.check(
		Schema.makeFilter(
			(value: string) => value.length <= 500 || 'Keep your bio under 500 characters.'
		)
	)
);

const decodeHandle = Schema.decodeUnknownResult(HandleSchema);
const decodeDisplayName = Schema.decodeUnknownResult(DisplayNameSchema);
const decodeBio = Schema.decodeUnknownResult(BioSchema);

const trimToNull = (value: FormDataEntryValue | null): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length === 0 ? null : trimmed;
};

const validate = (raw: {
	handle: string | null;
	displayName: string | null;
	bio: string | null;
}) => {
	const handle = decodeHandle(raw.handle);
	const displayName = decodeDisplayName(raw.displayName);
	const bio = decodeBio(raw.bio);

	const errors: Record<string, [string]> = {};
	if (Result.isFailure(handle)) errors.handle = [String(handle.failure)];
	if (Result.isFailure(displayName)) errors.displayName = [String(displayName.failure)];
	if (Result.isFailure(bio)) errors.bio = [String(bio.failure)];

	if (Object.keys(errors).length > 0) {
		return { ok: false as const, errors };
	}
	return {
		ok: true as const,
		values: {
			handle: (handle as Result.Success<string | null, never>).success,
			displayName: (displayName as Result.Success<string | null, never>).success,
			bio: (bio as Result.Success<string | null, never>).success
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		console.log('[updateProfile] hit', {
			hasSession: Boolean(locals.session),
			hasPlatform: Boolean(platform),
			hasDb: Boolean(platform?.env.DB)
		});

		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const raw = {
			handle: trimToNull(form.get('handle')),
			displayName: trimToNull(form.get('displayName')),
			bio: trimToNull(form.get('bio'))
		};
		console.log('[updateProfile] raw input', raw);

		const result = validate(raw);
		if (!result.ok) {
			console.log('[updateProfile] validation failed', result.errors);
			return fail(400, { values: raw, errors: result.errors });
		}
		console.log('[updateProfile] validated values', result.values);

		const { userId, email, organizationId, profilePictureUrl } = locals.session;
		if (!organizationId) {
			return fail(409, {
				values: raw,
				message: 'Your account is not linked to an organization yet.'
			});
		}

		const db = getDb(platform);
		try {
			// Upsert: provisioning may not have populated the row (e.g. a fresh
			// D1 after a session was already issued). On insert we fill the
			// non-form columns from the session; on conflict we only touch what
			// the form actually owns.
			const upsertResult = await db
				.insert(users)
				.values({
					workosUserId: userId,
					email,
					organizationId,
					avatarUrl: profilePictureUrl ?? null,
					handle: result.values.handle,
					displayName: result.values.displayName,
					bio: result.values.bio
				})
				.onConflictDoUpdate({
					target: users.workosUserId,
					set: {
						handle: result.values.handle,
						displayName: result.values.displayName,
						bio: result.values.bio,
						updatedAt: new Date()
					}
				})
				.returning({ workosUserId: users.workosUserId, handle: users.handle });
			console.log('[updateProfile] db upsert result', {
				workosUserId: userId,
				rows: upsertResult
			});
		} catch (caught) {
			const message = caught instanceof Error ? caught.message : '';
			console.log('[updateProfile] db error', message);
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
