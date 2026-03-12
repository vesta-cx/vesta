/** @format */

// Shared type enums for schema
export const OWNER_TYPES = ["user", "organization"] as const;
export type OwnerType = (typeof OWNER_TYPES)[number];

export const WORKSPACE_STATUSES = ["LISTED", "UNLISTED"] as const;
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const RESOURCE_TYPES = ["post", "song", "album", "status"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_STATUSES = ["LISTED", "UNLISTED"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const AUTHOR_TYPES = ["user", "workspace"] as const;
export type AuthorType = (typeof AUTHOR_TYPES)[number];

export const EXTERNAL_LINK_SUBJECT_TYPES = [
	"resource",
	"workspace",
] as const;
export type ExternalLinkSubjectType = (typeof EXTERNAL_LINK_SUBJECT_TYPES)[number];
