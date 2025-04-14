-- Migration: 004_expand_resource_types.sql

-- Add new, more specific resource types
-- Use the next available ID sequence instead of hardcoding IDs
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

-- Make sure all resource types have proper sequence values
SELECT setval('resource_types_id_seq', (SELECT MAX(id) FROM resource_types), true);