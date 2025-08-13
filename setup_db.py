import psycopg2
from psycopg2.extras import RealDictCursor
import uuid

def setup_database():
    # Database connection parameters
    db_params = {
        'host': 'localhost',
        'database': 'postgres',  # Connect to default database first
        'user': 'postgres',
        'password': 'root'  # Update this to match your PostgreSQL password
    }

    try:
        # Connect to default database
        conn = psycopg2.connect(**db_params)
        conn.autocommit = True
        cursor = conn.cursor()

        # Create omrscan database if it doesn't exist
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'omrscan'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute('CREATE DATABASE omrscan')

        cursor.close()
        conn.close()

        # Connect to omrscan database
        db_params['database'] = 'omrscan'
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Create UUID extension if not exists
        cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create a default admin user
        cursor.execute('''
            INSERT INTO users (username, email, password, role)
            VALUES ('admin', 'admin@example.com', 'admin123', 'admin')
            ON CONFLICT (username) DO NOTHING
        ''')

        # Get admin user id
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        admin_id = cursor.fetchone()['id']

        # Create batches table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS batches (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                batch_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                created_by UUID NOT NULL REFERENCES users(id),
                status TEXT NOT NULL DEFAULT 'processing',
                total_sheets INTEGER DEFAULT 0,
                processed_sheets INTEGER DEFAULT 0,
                average_score NUMERIC(3,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        ''')

        # Create omr_sheets table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS omr_sheets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                batch_id UUID NOT NULL REFERENCES batches(id),
                student_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                overall_score NUMERIC(3,2),
                confidence NUMERIC(5,4),
                processing_time INTEGER,
                responses JSONB,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP
            )
        ''')

        # Create feedback_questions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS feedback_questions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                template_id UUID NOT NULL,
                question_text TEXT NOT NULL,
                question_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        print("Database and tables created successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    setup_database()
