-- Rename static subject id 'user' to 'authenticated' (semantic: "any authenticated user").
-- No schema change; only data update for existing permission rows.
UPDATE permissions
SET subject_id = 'authenticated'
WHERE subject_type = 'static' AND subject_id = 'user';
