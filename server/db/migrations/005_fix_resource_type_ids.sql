BEGIN;

-- Step 1: Backup old type assignments
DROP TABLE IF EXISTS resource_type_backup;
CREATE TABLE resource_type_backup AS
SELECT id AS resource_id, resource_type_id FROM resources;

-- Step 2: Drop temp tables if they exist
DROP TABLE IF EXISTS type_id_mapping;
DROP TABLE IF EXISTS resource_types_new;

-- Step 3: Build ID mapping
CREATE TEMP TABLE type_id_mapping (
  old_id INT,
  new_id INT,
  name VARCHAR(100)
);

INSERT INTO type_id_mapping (old_id, new_id, name)
SELECT id,
       ROW_NUMBER() OVER (ORDER BY id) + 10 AS new_id,
       name
FROM resource_types;

-- Step 4: Prepare new resource_types table
CREATE TABLE resource_types_new (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50)
);

INSERT INTO resource_types_new (id, name, description, icon_name)
SELECT m.new_id, rt.name, rt.description, rt.icon_name
FROM resource_types rt
JOIN type_id_mapping m ON rt.id = m.old_id;

-- Step 5: Drop FK constraints
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_resource_type_id_fkey;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_resource_type_id_fkey;

-- Step 6: Update resource references
UPDATE resources r
SET resource_type_id = m.new_id
FROM type_id_mapping m
WHERE r.resource_type_id = m.old_id;

UPDATE services s
SET resource_type_id = m.new_id
FROM type_id_mapping m
WHERE s.resource_type_id = m.old_id;

-- Step 7: Replace old resource_types table
DROP TABLE resource_types;
ALTER TABLE resource_types_new RENAME TO resource_types;

-- Step 8: Restore constraints
ALTER TABLE resource_types ADD CONSTRAINT resource_types_name_unique UNIQUE (name);

ALTER TABLE resources ADD CONSTRAINT resources_resource_type_id_fkey 
  FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);

ALTER TABLE services ADD CONSTRAINT services_resource_type_id_fkey 
  FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);

CREATE INDEX IF NOT EXISTS idx_resource_type_name ON resource_types(name);

COMMIT;