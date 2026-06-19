-- Migration: Create tables for Trips, Loadouts, LoadoutNodes, LoadoutCollaborators, LoadoutShares, LoadoutTemplates
-- Up
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    destination TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loadouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scenario TEXT,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    base_template_id UUID REFERENCES loadout_templates(id) ON DELETE SET NULL,
    revision BIGINT NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loadout_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loadout_id UUID NOT NULL REFERENCES loadouts(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES loadout_nodes(id) ON DELETE SET NULL,
    usergear_registration_id UUID REFERENCES usergear_registrations(id) ON DELETE SET NULL,
    gear_id UUID REFERENCES gears(id) ON DELETE SET NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('gear','container','group','consumable')),
    name_snapshot TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    unit_weight_grams INT NOT NULL CHECK (unit_weight_grams >= 0),
    override_weight_grams INT CHECK (override_weight_grams >= 0),
    aggregate_weight_grams INT NOT NULL DEFAULT 0,
    zone TEXT,
    packed_state TEXT NOT NULL DEFAULT 'unpacked',
    sort_order INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loadout_collaborators (
    loadout_id UUID NOT NULL REFERENCES loadouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')),
    PRIMARY KEY (loadout_id, user_id)
);

CREATE TABLE IF NOT EXISTS loadout_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loadout_id UUID NOT NULL REFERENCES loadouts(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    mode TEXT NOT NULL CHECK (mode IN ('read','write')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loadout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_loadout_id UUID REFERENCES loadouts(id) ON DELETE SET NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visibility TEXT NOT NULL DEFAULT 'private',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loadouts_trip_id ON loadouts(trip_id);
CREATE INDEX IF NOT EXISTS idx_loadout_nodes_loadout_id ON loadout_nodes(loadout_id);
CREATE INDEX IF NOT EXISTS idx_loadout_nodes_parent ON loadout_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_loadout_collaborators_loadout ON loadout_collaborators(loadout_id);
CREATE INDEX IF NOT EXISTS idx_loadout_shares_loadout ON loadout_shares(loadout_id);

-- Down
-- Drop tables in reverse order
DROP TABLE IF EXISTS loadout_templates;
DROP TABLE IF EXISTS loadout_shares;
DROP TABLE IF EXISTS loadout_collaborators;
DROP TABLE IF EXISTS loadout_nodes;
DROP TABLE IF EXISTS loadouts;
DROP TABLE IF EXISTS trips;
