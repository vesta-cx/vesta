/** @format */

import { and, eq, exists, or, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
export {
	workspaceCreateSchema as createWorkspaceSchema,
	workspaceUpdateSchema as updateWorkspaceSchema,
} from "@vesta-cx/db/entity-schemas";
import {
	permissions,
	WORKSPACE_PERMISSION_ACTIONS,
	WORKSPACE_STATUSES,
	workspaces,
} from "../db/schema";
import { hasScope } from "../auth/helpers";
import { ADMIN_SCOPE, type AuthContext } from "../auth/types";
import type { Database } from "../db";

const OWNER_SUBJECT_TYPES = ["user", "organization"] as const;
export const LISTED_WORKSPACE_STATUS = WORKSPACE_STATUSES[0];
export const WORKSPACE_READ_ACTION =
	"workspaces:read" satisfies (typeof WORKSPACE_PERMISSION_ACTIONS)[number];
export const WORKSPACE_LINK_SUBJECT_TYPE = "workspace" as const;

export const workspaceListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: workspaces.ownerId },
		owner_type: { column: workspaces.ownerType },
		status: { column: workspaces.status },
		slug: { column: workspaces.slug },
	},
	sortable: {
		created_at: workspaces.createdAt,
		updated_at: workspaces.updatedAt,
		name: workspaces.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const listedWorkspaceWhere = eq(
	workspaces.status,
	LISTED_WORKSPACE_STATUS,
);

export const isWorkspaceOwnerSubject = (
	auth: AuthContext,
): auth is Extract<AuthContext, { subjectType: "user" | "organization" }> =>
	auth.type !== "guest" &&
	(OWNER_SUBJECT_TYPES as readonly string[]).includes(auth.subjectType);

export const workspaceOwnerWhere = (auth: AuthContext): SQL | undefined => {
	if (!isWorkspaceOwnerSubject(auth)) return undefined;
	return and(
		eq(workspaces.ownerType, auth.subjectType),
		eq(workspaces.ownerId, auth.subjectId),
	);
};

export const workspaceMutationWhere = (auth: AuthContext, id: string): SQL => {
	if (hasScope(auth, ADMIN_SCOPE)) return eq(workspaces.id, id);
	const ownerWhere = workspaceOwnerWhere(auth);
	return ownerWhere ? and(eq(workspaces.id, id), ownerWhere) : sql`0`;
};

export const workspaceAccessWhere = (
	db: Database,
	auth: AuthContext,
	objectId: string | AnyColumn,
): SQL => {
	const ownerWhere = workspaceOwnerWhere(auth);
	const explicitAllowWhere =
		isWorkspaceOwnerSubject(auth) ?
			exists(
				db
					.select({ id: permissions.id })
					.from(permissions)
					.where(
						and(
							eq(
								permissions.subjectType,
								auth.subjectType,
							),
							eq(
								permissions.subjectId,
								auth.subjectId,
							),
							eq(
								permissions.objectType,
								WORKSPACE_LINK_SUBJECT_TYPE,
							),
							eq(
								permissions.objectId,
								objectId,
							),
							eq(
								permissions.action,
								WORKSPACE_READ_ACTION,
							),
							eq(
								permissions.value,
								"allow",
							),
						),
					),
			)
		:	undefined;

	const accessBranches = [
		listedWorkspaceWhere,
		explicitAllowWhere,
		ownerWhere,
	].filter((branch): branch is SQL => branch !== undefined);

	return or(...accessBranches) ?? listedWorkspaceWhere;
};

export const canReadWorkspace = async (
	db: Database,
	auth: AuthContext,
	id: string,
): Promise<boolean> => {
	const where =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(workspaces.id, id)
		:	and(eq(workspaces.id, id), workspaceAccessWhere(db, auth, id));
	const [workspace] = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(where)
		.limit(1);
	return Boolean(workspace);
};

export const canMutateWorkspace = async (
	db: Database,
	auth: AuthContext,
	id: string,
): Promise<boolean> => {
	const [workspace] = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(workspaceMutationWhere(auth, id))
		.limit(1);
	return Boolean(workspace);
};
