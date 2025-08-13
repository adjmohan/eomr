import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        # Get database config
        db_config = {
            'host': os.getenv('PGHOST', 'localhost'),
            'database': os.getenv('PGDATABASE', 'ORM'),
            'user': os.getenv('PGUSER', 'postgres'),
            'password': os.getenv('PGPASSWORD', 'root'),
            'port': os.getenv('PGPORT', '5432')
        }
        
        # Log connection attempt (without password)
        log_config = db_config.copy()
        log_config.pop('password')
        logger.info(f"Connecting to database with config: {log_config}")
        
        conn = psycopg2.connect(**db_config)
        logger.info("Database connection successful")
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return None

@app.route('/api/results/<batch_code>', methods=['GET'])
def get_results(batch_code):
    logger.info(f"Received request for batch: {batch_code}")
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT batch_code, phase, total_students, subjects, created_at
                FROM omr_results 
                WHERE batch_code = %s
            """, (batch_code,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not result:
                return jsonify({'error': 'Batch not found'}), 404
            
            return jsonify({
                'batchCode': result['batch_code'],
                'phase': result['phase'],
                'totalStudents': result['total_students'],
                'subjects': result['subjects'],
                'createdAt': result['created_at'].isoformat()
            })
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        logger.error(f"Error in get_results: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.now().isoformat()
            })
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'timestamp': datetime.now().isoformat()
        }), 503
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)
