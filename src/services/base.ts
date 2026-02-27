/** @format */

import { and, eq, sql, type SQL, type Column } from "drizzle-orm";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import type { Database } from "../db";
import type { ParsedListQuery } from "@mia-cx/drizzle-query-factory";

export const paginatedList = async <T extends SQLiteTableWithColumns<any>>(
	db: Database,
	table: T,
	query: ParsedListQuery,
	authWhere?: SQL,
) => {
	const finalWhere =
		authWhere ?
			query.where ?
				and(authWhere, query.where)
			:	authWhere
		:	query.where;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(table)
			.where(finalWhere)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(table)
			.where(finalWhere),
	]);

	const total = countResult[0]?.total ?? 0;
	return { rows, total };
};

export const getById = async <T extends SQLiteTableWithColumns<any>>(
	db: Database,
	table: T,
	idColumn: Column,
	id: string,
	authWhere?: SQL,
) => {
	const where =
		authWhere ? and(eq(idColumn, id), authWhere) : eq(idColumn, id);

	const rows = await db.select().from(table).where(where).limit(1);
	return rows[0] ?? null;
};

export const insertRow = async <T extends SQLiteTableWithColumns<any>>(
	db: Database,
	table: T,
	data: Record<string, unknown>,
) => {
	const rows = await db.insert(table).values(data).returning();
	return rows[0] ?? null;
};

export const updateRow = async <T extends SQLiteTableWithColumns<any>>(
	db: Database,
	table: T,
	idColumn: Column,
	id: string,
	data: Record<string, unknown>,
	authWhere?: SQL,
) => {
	const where =
		authWhere ? and(eq(idColumn, id), authWhere) : eq(idColumn, id);

	const rows = await db.update(table).set(data).where(where).returning();
	return rows[0] ?? null;
};

export const deleteRow = async <T extends SQLiteTableWithColumns<any>>(
	db: Database,
	table: T,
	idColumn: Column,
	id: string,
	authWhere?: SQL,
) => {
	const where =
		authWhere ? and(eq(idColumn, id), authWhere) : eq(idColumn, id);

	const rows = await db.delete(table).where(where).returning();
	return rows[0] ?? null;
};
