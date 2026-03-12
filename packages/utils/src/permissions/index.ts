/** @format */

export type PermissionValue = "allow" | "deny" | "unset";
export type PermissionSubjectType =
	| "user"
	| "team"
	| "organization"
	| "static";

export type PermissionRow = {
	subjectType: PermissionSubjectType;
	subjectId: string;
	objectType: string;
	objectId: string;
	action: string;
	value: PermissionValue;
};

export type PermissionPrincipal = {
	subjectType: PermissionSubjectType;
	subjectId: string;
};

const SUBJECT_PRECEDENCE: readonly PermissionSubjectType[] = [
	"user",
	"team",
	"organization",
	"static",
];

export const resolvePermissionValue = (
	rows: readonly PermissionRow[],
	args: {
		objectType: string;
		objectId: string;
		action: string;
		principals: readonly PermissionPrincipal[];
	},
): PermissionValue => {
	const principalSet = new Set(
		args.principals.map(
			(principal) => `${principal.subjectType}:${principal.subjectId}`,
		),
	);

	const relevantRows = rows.filter((row) => {
		if (
			row.objectType !== args.objectType ||
			row.objectId !== args.objectId ||
			row.action !== args.action
		) {
			return false;
		}
		const key = `${row.subjectType}:${row.subjectId}`;
		return principalSet.has(key);
	});

	for (const subjectType of SUBJECT_PRECEDENCE) {
		const subjectRows = relevantRows.filter(
			(row) => row.subjectType === subjectType,
		);
		if (subjectRows.some((row) => row.value === "deny")) {
			return "deny";
		}
		if (subjectRows.some((row) => row.value === "allow")) {
			return "allow";
		}
	}

	return "unset";
};

export const canPrincipalPerformAction = (
	rows: readonly PermissionRow[],
	args: {
		objectType: string;
		objectId: string;
		action: string;
		principals: readonly PermissionPrincipal[];
		isOwner?: boolean;
	},
): boolean =>
	args.isOwner === true || resolvePermissionValue(rows, args) === "allow";
