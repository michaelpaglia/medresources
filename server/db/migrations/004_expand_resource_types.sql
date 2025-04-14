-- Migration: 004_expand_resource_types.sql

-- First, check for duplicates
SELECT name, COUNT(*) 
FROM resource_types 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Create a temporary table to store the IDs we want to keep
CREATE TEMP TABLE resource_types_to_keep AS
SELECT MIN(id) as id, name
FROM resource_types
GROUP BY name;

-- Delete all duplicates while keeping one copy of each
DELETE FROM resource_types
WHERE id NOT IN (SELECT id FROM resource_types_to_keep);

-- Now add the constraint
ALTER TABLE resource_types ADD CONSTRAINT resource_types_name_key UNIQUE (name);

-- Add new, more specific resource types
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

-- Drop the temporary table
DROP TABLE resource_types_to_keep;

-- Make sure all resource types have proper sequence values
SELECT setval('resource_types_id_seq', (SELECT MAX(id) FROM resource_types), true);