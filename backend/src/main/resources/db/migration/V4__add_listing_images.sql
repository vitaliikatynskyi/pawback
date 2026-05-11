CREATE TABLE listing_images (
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url VARCHAR(2048) NOT NULL,
    PRIMARY KEY (listing_id, image_url)
);
