import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { Result, Schema } from 'effect';
import { TerminalAuthError } from '@vesta-cx/auth';
import { handles, users } from '@vesta-cx/db';
import {
	RESERVED_HANDLES,
	USER_HANDLE_MAX_LENGTH,
	USER_HANDLE_MIN_LENGTH,
	USER_HANDLE_PATTERN,
	toHandleLower,
	isMultiLineSafe,
	isSingleLineSafe
} from '@vesta-cx/db/entity-schemas';
import { createWebAuthRuntime } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { Actions } from './$types';

/**
 * Form-side validation schemas. We re-validate at the edge (don't trust the
 * client) and surface field-keyed messages for the dialog form.
 *
 * Charset rules:
 * - Handle: letters, digits, hyphens, underscores. A subset of RFC 3986
 *   "unreserved" so the handle survives a URL path segment without
 *   percent-encoding. Period and tilde are technically unreserved too but
 *   excluded for legibility. Uniqueness is case-insensitive.
 * - Display name: any Unicode character except control characters (Cc).
 *   Single line — newlines are control chars and therefore rejected.
 * - Bio: any Unicode character except control characters, with tab, line
 *   feed, and carriage return allowed so users can format paragraphs.
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
				USER_HANDLE_PATTERN.test(value) || 'Use letters, numbers, hyphens, or underscores.'
		),
		Schema.makeFilter(
			(value: string) => !RESERVED_HANDLES.has(toHandleLower(value)) || 'That handle is reserved.'
		)
	)
);

const AccountNameSchema = Schema.String.check(
	Schema.makeFilter((value: string) => value.length <= 80 || 'Use 80 characters or fewer.'),
	Schema.makeFilter(
		(value: string) => isSingleLineSafe(value) || 'Names cannot contain line breaks.'
	)
);

const AccountEmailSchema = Schema.String.check(
	Schema.makeFilter((value: string) => value.length > 0 || 'Enter an email address.'),
	Schema.makeFilter((value: string) => value.length <= 254 || 'Use 254 characters or fewer.'),
	Schema.makeFilter(
		(value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address.'
	)
);

const DisplayNameSchema = Schema.NullOr(
	Schema.String.check(
		Schema.makeFilter(
			(value: string) => value.length <= 80 || 'Keep your display name under 80 characters.'
		),
		Schema.makeFilter(
			(value: string) =>
				isSingleLineSafe(value) || 'Display name cannot contain control characters or line breaks.'
		)
	)
);

const BioSchema = Schema.NullOr(
	Schema.String.check(
		Schema.makeFilter(
			(value: string) => value.length <= 500 || 'Keep your bio under 500 characters.'
		),
		Schema.makeFilter(
			(value: string) => isMultiLineSafe(value) || 'Bio cannot contain control characters.'
		)
	)
);

const decodeHandle = Schema.decodeUnknownResult(HandleSchema);
const decodeAccountName = Schema.decodeUnknownResult(AccountNameSchema);
const decodeAccountEmail = Schema.decodeUnknownResult(AccountEmailSchema);
const decodeDisplayName = Schema.decodeUnknownResult(DisplayNameSchema);
const PasswordSchema = Schema.String.check(
	Schema.makeFilter((value: string) => value.length > 0 || 'Enter your password.')
);

const VerificationCodeSchema = Schema.String.check(
	Schema.makeFilter((value: string) => /^\d{6}$/.test(value) || 'Enter the 6-digit code.')
);

const NewPasswordSchema = Schema.String.check(
	Schema.makeFilter((value: string) => value.length >= 8 || 'Use at least 8 characters.'),
	Schema.makeFilter((value: string) => value.length <= 72 || 'Use 72 characters or fewer.')
);

const decodeBio = Schema.decodeUnknownResult(BioSchema);
const decodePassword = Schema.decodeUnknownResult(PasswordSchema);
const decodeVerificationCode = Schema.decodeUnknownResult(VerificationCodeSchema);
const decodeNewPassword = Schema.decodeUnknownResult(NewPasswordSchema);

const trimToNull = (value: FormDataEntryValue | null): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length === 0 ? null : trimmed;
};

const toClientSafeError = (caught: unknown) => {
	if (!(caught instanceof Error)) return { message: String(caught) };
	const details = caught as Error & {
		code?: unknown;
		status?: unknown;
		statusCode?: unknown;
		requestId?: unknown;
	};

	return {
		name: caught.name,
		message: caught.message,
		...(details.code ? { code: String(details.code) } : {}),
		...(details.status ? { status: String(details.status) } : {}),
		...(details.statusCode ? { statusCode: String(details.statusCode) } : {}),
		...(details.requestId ? { requestId: String(details.requestId) } : {})
	};
};

const validateProfile = (raw: {
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

const validateAccount = (raw: { firstName: string; lastName: string; email: string }) => {
	const firstName = decodeAccountName(raw.firstName);
	const lastName = decodeAccountName(raw.lastName);
	const email = decodeAccountEmail(raw.email);

	const errors: Record<string, [string]> = {};
	if (Result.isFailure(firstName)) errors.firstName = [String(firstName.failure)];
	if (Result.isFailure(lastName)) errors.lastName = [String(lastName.failure)];
	if (Result.isFailure(email)) errors.email = [String(email.failure)];

	if (Object.keys(errors).length > 0) {
		return { ok: false as const, errors };
	}
	return {
		ok: true as const,
		values: {
			firstName: (firstName as Result.Success<string, never>).success.trim() || null,
			lastName: (lastName as Result.Success<string, never>).success.trim() || null,
			email: (email as Result.Success<string, never>).success.trim().toLowerCase()
		}
	};
};

const validatePasswordChange = (raw: {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}) => {
	const currentPassword = decodePassword(raw.currentPassword);
	const newPassword = decodeNewPassword(raw.newPassword);
	const confirmPassword = decodePassword(raw.confirmPassword);

	const errors: Record<string, [string]> = {};
	if (Result.isFailure(currentPassword)) errors.currentPassword = [String(currentPassword.failure)];
	if (Result.isFailure(newPassword)) errors.newPassword = [String(newPassword.failure)];
	if (Result.isFailure(confirmPassword)) errors.confirmPassword = [String(confirmPassword.failure)];
	if (raw.newPassword && raw.confirmPassword && raw.newPassword !== raw.confirmPassword) {
		errors.confirmPassword = ['Passwords do not match.'];
	}
	if (raw.currentPassword && raw.newPassword && raw.currentPassword === raw.newPassword) {
		errors.newPassword = ['Choose a password you are not already using.'];
	}

	if (Object.keys(errors).length > 0) {
		return { ok: false as const, errors };
	}
	return {
		ok: true as const,
		values: {
			currentPassword: (currentPassword as Result.Success<string, never>).success,
			newPassword: (newPassword as Result.Success<string, never>).success
		}
	};
};

export const actions: Actions = {
	updateAccount: async ({ request, locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const raw = {
			firstName: String(form.get('firstName') ?? ''),
			lastName: String(form.get('lastName') ?? ''),
			email: String(form.get('email') ?? '')
		};
		const result = validateAccount(raw);
		if (!result.ok) return fail(400, { values: raw, errors: result.errors });

		try {
			const runtime = createWebAuthRuntime(platform);
			const currentAccount = await runtime.getUser({ userId: locals.session.userId });
			const emailChanged = result.values.email !== currentAccount.email.toLowerCase();
			const account = await runtime.updateUserDetails({
				userId: locals.session.userId,
				firstName: result.values.firstName,
				lastName: result.values.lastName
			});

			if (emailChanged) {
				await runtime.sendEmailChangeCode({
					userId: locals.session.userId,
					newEmail: result.values.email
				});
			}

			return {
				account,
				...(emailChanged ? { pendingEmail: result.values.email } : {})
			};
		} catch {
			return fail(500, {
				message: 'Account details could not be saved. Try again in a moment.'
			});
		}
	},
	confirmEmailChange: async ({ request, locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const code = String(form.get('code') ?? '').replace(/\s+/g, '');
		const decodedCode = decodeVerificationCode(code);
		if (Result.isFailure(decodedCode)) {
			return fail(400, { errors: { code: [String(decodedCode.failure)] } });
		}

		try {
			const account = await createWebAuthRuntime(platform).confirmEmailChange({
				userId: locals.session.userId,
				code: (decodedCode as Result.Success<string, never>).success
			});

			await getDb(platform)
				.update(users)
				.set({ email: account.email, updatedAt: new Date() })
				.where(eq(users.workosUserId, locals.session.userId));

			return { account };
		} catch {
			return fail(400, {
				errors: { code: ['That code did not verify. Try the latest code from your email.'] }
			});
		}
	},
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

		const result = validateProfile(raw);
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
		const handleNormalized = result.values.handle ? toHandleLower(result.values.handle) : null;
		try {
			// Keep the new global registry and the legacy user columns in one D1
			// batch. D1 batches are atomic, so a racing handle claim cannot leave
			// the profile and registry disagreeing about who owns the name.
			const handleMutation = result.values.handle
				? db
						.insert(handles)
						.values({
							handle: result.values.handle,
							subjectType: 'user',
							subjectId: userId
						})
						.onConflictDoUpdate({
							target: [handles.subjectType, handles.subjectId],
							set: {
								handle: result.values.handle,
								updatedAt: new Date()
							}
						})
				: db
						.delete(handles)
						.where(and(eq(handles.subjectType, 'user'), eq(handles.subjectId, userId)));

			// Provisioning may not have populated the row yet. On insert, seed
			// session-owned fields; on conflict, only touch profile-owned fields.
			const userUpsert = db
				.insert(users)
				.values({
					workosUserId: userId,
					email,
					organizationId,
					avatarUrl: profilePictureUrl ?? null,
					handle: result.values.handle,
					handleNormalized,
					displayName: result.values.displayName,
					bio: result.values.bio
				})
				.onConflictDoUpdate({
					target: users.workosUserId,
					set: {
						handle: result.values.handle,
						handleNormalized,
						displayName: result.values.displayName,
						bio: result.values.bio,
						updatedAt: new Date()
					}
				})
				.returning({ workosUserId: users.workosUserId, handle: users.handle });

			const [, upsertResult] = await db.batch([handleMutation, userUpsert]);
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
	},
	enrollTotp: async ({ locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		try {
			const enrollment = await createWebAuthRuntime(platform).enrollTotpFactor({
				userId: locals.session.userId,
				issuer: 'Vesta',
				label: locals.session.email
			});

			return { enrollment };
		} catch {
			return fail(500, {
				message: 'Authenticator app setup could not be started. Try again in a moment.'
			});
		}
	},
	verifyTotpEnrollment: async ({ request, locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const factorId = String(form.get('factorId') ?? '');
		const challengeId = String(form.get('challengeId') ?? '');
		const code = String(form.get('code') ?? '').replace(/\s+/g, '');
		const decodedCode = decodeVerificationCode(code);
		if (!factorId) {
			return fail(400, { message: 'Authenticator setup session is missing.' });
		}
		if (Result.isFailure(decodedCode)) {
			return fail(400, { errors: { code: [String(decodedCode.failure)] } });
		}

		try {
			const runtime = createWebAuthRuntime(platform);
			const { userId } = locals.session;
			await runtime.verifyTotpEnrollment({
				userId,
				factorId,
				...(challengeId ? { challengeId } : {}),
				code: (decodedCode as Result.Success<string, never>).success
			});

			const factors = await runtime.listAuthFactors({ userId });
			await Promise.all(
				factors
					.filter((factor) => factor.type === 'totp' && factor.id !== factorId)
					.map((factor) => runtime.deleteAuthFactor({ userId, factorId: factor.id }))
			);
		} catch (caught) {
			const debug = toClientSafeError(caught);
			console.error('[verifyTotpEnrollment] WorkOS verification failed', debug, caught);
			return fail(400, {
				errors: { code: ['That code did not verify. Try the latest code from your app.'] },
				debug
			});
		}

		return { success: true };
	},
	deleteAuthFactor: async ({ request, locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const factorId = String(form.get('factorId') ?? '');
		if (!factorId) {
			return fail(400, { message: 'Choose an authentication factor to remove.' });
		}

		try {
			await createWebAuthRuntime(platform).deleteAuthFactor({
				userId: locals.session.userId,
				factorId
			});
		} catch {
			return fail(500, {
				message: 'Authentication factor could not be removed. Try again in a moment.'
			});
		}

		return { success: true };
	},
	revokeSession: async ({ request, locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const sessionId = String(form.get('sessionId') ?? '');
		if (!sessionId) return fail(400, { message: 'Choose a session to revoke.' });
		if (sessionId === locals.session.sessionId) {
			return fail(400, { message: 'Use sign out to end your current session.' });
		}

		try {
			await createWebAuthRuntime(platform).revokeSession({
				userId: locals.session.userId,
				sessionId
			});
		} catch {
			return fail(500, { message: 'Session could not be revoked. Try again in a moment.' });
		}

		return { success: true };
	},
	revokeOtherSessions: async ({ locals, platform }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		try {
			await createWebAuthRuntime(platform).revokeOtherSessions({
				userId: locals.session.userId,
				currentSessionId: locals.session.sessionId
			});
		} catch {
			return fail(500, { message: 'Sessions could not be revoked. Try again in a moment.' });
		}

		return { success: true };
	},
	changePassword: async ({ request, locals, platform, getClientAddress }) => {
		if (!locals.session) return fail(401, { message: 'Unauthenticated' });
		if (!platform) return fail(500, { message: 'Platform not available' });

		const form = await request.formData();
		const raw = {
			currentPassword: String(form.get('currentPassword') ?? ''),
			newPassword: String(form.get('newPassword') ?? ''),
			confirmPassword: String(form.get('confirmPassword') ?? '')
		};

		const result = validatePasswordChange(raw);
		if (!result.ok) return fail(400, { errors: result.errors });

		try {
			await createWebAuthRuntime(platform).changePassword({
				userId: locals.session.userId,
				email: locals.session.email,
				currentPassword: result.values.currentPassword,
				newPassword: result.values.newPassword,
				ipAddress: getClientAddress(),
				userAgent: request.headers.get('user-agent') ?? undefined
			});
		} catch (caught) {
			if (caught instanceof TerminalAuthError && caught.operation === 'authenticateWithPassword') {
				return fail(400, {
					errors: {
						currentPassword: ['Current password does not match this account.']
					}
				});
			}

			return fail(500, {
				message: 'Password could not be changed. Try again in a moment.'
			});
		}

		return { success: true };
	}
};
