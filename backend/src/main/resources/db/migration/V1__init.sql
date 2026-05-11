CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    username VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(255),
    bio TEXT,
    city VARCHAR(100),
    is_verified_diia BOOLEAN DEFAULT FALSE,
    diia_verified_at TIMESTAMP,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255)
);

CREATE TABLE listings (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    pet_type VARCHAR(20) NOT NULL,
    pet_name VARCHAR(100),
    breed VARCHAR(100),
    color VARCHAR(100),
    distinctive_marks TEXT,
    description TEXT,
    event_date TIMESTAMP,
    location geometry(Point, 4326),
    city VARCHAR(100),
    district VARCHAR(100),
    address_text TEXT,
    reward_amount DECIMAL(10, 2),
    reward_currency VARCHAR(10),
    views_count INT DEFAULT 0,
    contacts_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_listings_location ON listings USING GIST (location);
