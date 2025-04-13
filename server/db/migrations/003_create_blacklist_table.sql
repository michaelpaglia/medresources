CREATE TABLE resource_blacklist (
  id SERIAL PRIMARY KEY,
  npi VARCHAR(20) UNIQUE,
  name VARCHAR(200) NOT NULL,
  address_line1 VARCHAR(200),
  zip VARCHAR(10),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient lookups
CREATE INDEX idx_resource_blacklist_npi ON resource_blacklist(npi);
CREATE INDEX idx_resource_blacklist_name_address ON resource_blacklist(name, address_line1);