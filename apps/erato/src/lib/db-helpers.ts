/** @format */

const readErrorCode = (error: unknown): string => {
	if (!error || typeof error !== "object") return "";
	const record = error as Record<string, unknown>;
	return (
		[record.code, record.cause]
			.map((value) => {
				if (typeof value === "string") return value;
				if (value && typeof value === "object") {
					const causeCode = (
						value as Record<string, unknown>
					).code;
					return typeof causeCode === "string" ?
							causeCode
						:	"";
				}
				return "";
			})
			.find(Boolean) ?? ""
	);
};

const readErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

export const isUniqueConstraintError = (error: unknown): boolean => {
	const code = readErrorCode(error);
	if (code === "SQLITE_CONSTRAINT_UNIQUE" || code === "23505")
		return true;
	return /UNIQUE|unique constraint/i.test(readErrorMessage(error));
};

export const isForeignKeyConstraintError = (error: unknown): boolean => {
	const code = readErrorCode(error);
	if (code === "SQLITE_CONSTRAINT_FOREIGNKEY" || code === "23503")
		return true;
	return /FOREIGN KEY/i.test(readErrorMessage(error));
};

export const expectOne = <T>(rows: readonly T[], label: string): T => {
	const row = rows[0];
	if (!row) throw new Error(`${label} returned no row`);
	return row;
};
