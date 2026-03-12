/** @format */

import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Organizations are managed by WorkOS. This table stores vesta-specific
// extensions (branding, theme config) that don't belong in WorkOS.

export const organizations = sqliteTable("organizations", {
	workosOrgId: text("workos_org_id").primaryKey(),
	avatarUrl: text("avatar_url"),
	bannerUrl: text("banner_url"),
	themeConfig: text("theme_config", { mode: "json" }).$type<{
		colors?: Record<string, string>;
		fonts?: Record<string, string>;
		layout?: string;
	}>(),
});
