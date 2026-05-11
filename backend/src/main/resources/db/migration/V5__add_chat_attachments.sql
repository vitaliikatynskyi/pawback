-- Add attachment support to chat messages
ALTER TABLE chat_messages 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN file_url TEXT,
ADD COLUMN file_type VARCHAR(50);
