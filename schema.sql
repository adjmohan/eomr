-- Create the result table if it doesn't exist
CREATE TABLE IF NOT EXISTS result (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    phase VARCHAR(50) NOT NULL,
    total_students INTEGER NOT NULL,
    subjects JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
