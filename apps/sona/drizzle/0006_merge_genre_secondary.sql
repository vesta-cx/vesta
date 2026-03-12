-- Merge genre_secondary into genre (comma-separated), then drop genre_secondary
UPDATE `source_files`
SET `genre` = CASE
	WHEN `genre` IS NULL OR trim(`genre`) = '' THEN trim(`genre_secondary`)
	ELSE trim(`genre` || ', ' || `genre_secondary`)
END
WHERE `genre_secondary` IS NOT NULL AND trim(`genre_secondary`) != '';

-- SQLite 3.35+ supports DROP COLUMN
ALTER TABLE `source_files` DROP COLUMN `genre_secondary`;
