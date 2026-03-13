/** @format */

import { eq } from "drizzle-orm";
import { sqliteView } from "drizzle-orm/sqlite-core";
import { collections } from "./collections";
import { engagements } from "./engagements";
import { resources } from "./resources";
import { workspaces } from "./workspaces";

export const publicResourcesV0 = sqliteView("public_resources_v0").as((qb) =>
	qb.select().from(resources).where(eq(resources.status, "LISTED")),
);

export const publicCollectionsV0 = sqliteView("public_collections_v0").as(
	(qb) =>
		qb
			.select()
			.from(collections)
			.where(eq(collections.status, "LISTED")),
);

export const publicWorkspacesV0 = sqliteView("public_workspaces_v0").as((qb) =>
	qb.select().from(workspaces).where(eq(workspaces.status, "LISTED")),
);

export const engagementTimelineV0 = sqliteView("engagement_timeline_v0").as(
	(qb) =>
		qb
			.select({
				id: engagements.id,
				subjectType: engagements.subjectType,
				subjectId: engagements.subjectId,
				action: engagements.action,
				objectType: engagements.objectType,
				objectId: engagements.objectId,
				createdAt: engagements.createdAt,
			})
			.from(engagements),
);
