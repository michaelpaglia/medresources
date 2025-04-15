-- Migration: 004_expand_resource_types.sql

-- Remove duplicate resource types
WITH duplicates AS (
  SELECT name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as row_num
  FROM resource_types
)
DELETE FROM resource_types
WHERE id IN (
  SELECT id 
  FROM resource_types r
  JOIN duplicates d ON r.name = d.name
  WHERE d.row_num > 1
);

-- Ensure a unique constraint on name
ALTER TABLE resource_types ADD CONSTRAINT resource_types_name_unique UNIQUE (name);

-- Add new, more specific resource types with checks
INSERT INTO resource_types (name, description, icon_name)
VALUES
  ('Chiropractic', 'Chiropractic care providers', 'chiropractic-icon'),
  ('Family Medicine', 'Family medicine practices', 'family-medicine-icon'),
  ('Pediatrics', 'Pediatric healthcare providers', 'pediatrics-icon'),
  ('Cardiology', 'Cardiac care specialists', 'cardiology-icon'),
  ('Dermatology', 'Skin care specialists', 'dermatology-icon'),
  ('OB/GYN', 'Obstetrics and gynecology providers', 'obgyn-icon'),
  ('Physical Therapy', 'Physical therapy services', 'pt-icon'),
  ('Optometry', 'Eye care providers', 'eye-icon'),
  ('Neurology', 'Neurological specialists', 'neurology-icon'),
  ('Orthopedics', 'Bone and joint specialists', 'orthopedics-icon'),
  ('ENT', 'Ear, nose, and throat specialists', 'ent-icon'),
  ('Podiatry', 'Foot care specialists', 'foot-icon'),
  ('Radiology', 'Imaging centers', 'radiology-icon'),
  ('Laboratory', 'Medical testing facilities', 'lab-icon'),
  ('Outpatient Surgery', 'Surgical centers', 'surgery-icon'),
  ('Naturopathic', 'Naturopathic medicine providers', 'naturopathic-icon'),
  ('Integrative Medicine', 'Combined conventional and alternative practices', 'integrative-icon')
ON CONFLICT (name) DO NOTHING;

-- Rename any existing generic resource types to be more descriptive
UPDATE resource_types 
SET name = 'Generic Health Center', description = 'General healthcare services'
WHERE name = 'Health Center';

-- Make sure all resource types have proper sequence values
SELECT setval('resource_types_id_seq', (SELECT MAX(id) FROM resource_types), true);