import os
import json
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from PIL import Image
import pdf2image
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import io
import base64
from werkzeug.utils import secure_filename
import tempfile
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],  # Add your frontend URL
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database connection
def get_db_connection():
    try:
        # Get database config from environment variables
        db_config = {
            'host': os.getenv('PGHOST', 'localhost'),
            'database': os.getenv('PGDATABASE', 'omrscan'),
            'user': os.getenv('PGUSER', 'postgres'),
            'password': os.getenv('PGPASSWORD', 'root'),
            'port': os.getenv('PGPORT', '5432')
        }
        
        # Log connection attempt (without password)
        log_config = db_config.copy()
        log_config.pop('password')
        logger.info(f"Attempting database connection with config: {log_config}")
        
        conn = psycopg2.connect(**db_config)
        logger.info("Database connection successful")
        return conn
        
    except psycopg2.Error as e:
        logger.error(f"PostgreSQL Error: {e.diag.message_primary if hasattr(e, 'diag') else str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in database connection: {str(e)}")
        return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class OMRProcessor:
    def __init__(self):
        self.question_regions = [
            # Define regions for 5 questions with 5 rating options each
            # Format: (x, y, width, height) for each option
            # Question 1: Course Content Quality
            [(100, 150, 25, 25), (140, 150, 25, 25), (180, 150, 25, 25), (220, 150, 25, 25), (260, 150, 25, 25)],
            # Question 2: Teaching Effectiveness  
            [(100, 200, 25, 25), (140, 200, 25, 25), (180, 200, 25, 25), (220, 200, 25, 25), (260, 200, 25, 25)],
            # Question 3: Learning Materials
            [(100, 250, 25, 25), (140, 250, 25, 25), (180, 250, 25, 25), (220, 250, 25, 25), (260, 250, 25, 25)],
            # Question 4: Assessment Methods
            [(100, 300, 25, 25), (140, 300, 25, 25), (180, 300, 25, 25), (220, 300, 25, 25), (260, 300, 25, 25)],
            # Question 5: Overall Satisfaction
            [(100, 350, 25, 25), (140, 350, 25, 25), (180, 350, 25, 25), (220, 350, 25, 25), (260, 350, 25, 25)]
        ]
        
        self.questions = [
            "Course Content Quality",
            "Teaching Effectiveness", 
            "Learning Materials",
            "Assessment Methods",
            "Overall Satisfaction"
        ]

    def preprocess_image(self, image):
        """Preprocess image for better OMR detection"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive threshold for better contrast
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)
        
        return thresh

    def detect_filled_circles(self, image, regions):
        """Detect filled circles/marks in specified regions"""
        processed_image = self.preprocess_image(image)
        results = []
        
        for i, question_regions in enumerate(regions):
            question_results = []
            
            for j, (x, y, w, h) in enumerate(question_regions):
                # Extract region of interest
                roi = processed_image[y:y+h, x:x+w]
                
                if roi.size == 0:
                    question_results.append(0)
                    continue
                
                # Calculate the percentage of filled pixels
                total_pixels = roi.size
                filled_pixels = cv2.countNonZero(roi)
                fill_percentage = filled_pixels / total_pixels
                
                # Consider it marked if more than 30% is filled
                is_marked = fill_percentage > 0.3
                confidence = min(fill_percentage * 2, 1.0)  # Convert to confidence score
                
                question_results.append({
                    'option': j + 1,
                    'is_marked': is_marked,
                    'confidence': confidence,
                    'fill_percentage': fill_percentage
                })
            
            results.append(question_results)
        
        return results

    def calculate_ratings(self, detection_results):
        """Calculate ratings based on detection results"""
        ratings = []
        
        for i, question_results in enumerate(detection_results):
            # Find the highest confidence marked option
            marked_options = [r for r in question_results if r['is_marked']]
            
            if marked_options:
                # Select the option with highest confidence
                best_option = max(marked_options, key=lambda x: x['confidence'])
                rating = best_option['option']
                confidence = best_option['confidence']
            else:
                # No clear marking detected, assign neutral rating
                rating = 3
                confidence = 0.1
            
            ratings.append({
                'question': self.questions[i],
                'rating': rating,
                'confidence': confidence,
                'percentage': (rating / 5) * 100
            })
        
        return ratings

    def process_image_file(self, image_path):
        """Process an image file and extract OMR data"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Could not load image")
            
            # Detect filled circles
            detection_results = self.detect_filled_circles(image, self.question_regions)
            
            # Calculate ratings
            ratings = self.calculate_ratings(detection_results)
            
            return {
                'success': True,
                'ratings': ratings,
                'overall_score': sum(r['rating'] for r in ratings) / len(ratings),
                'confidence': sum(r['confidence'] for r in ratings) / len(ratings)
            }
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {
                'success': False,
                'error': str(e),
                'ratings': [],
                'overall_score': 0,
                'confidence': 0
            }

    def convert_pdf_to_images(self, pdf_path):
        """Convert PDF to images for processing"""
        try:
            images = pdf2image.convert_from_path(pdf_path)
            return [np.array(img) for img in images]
        except Exception as e:
            logger.error(f"Error converting PDF: {e}")
            return []

@app.route('/api/upload-omr', methods=['POST'])
def upload_omr():
    try:
        # Get form data
        batch_code = request.form.get('batchCode')
        phase = request.form.get('phase')
        total_students = request.form.get('totalStudents')
        subjects_json = request.form.get('subjects')
        
        if not all([batch_code, phase, total_students, subjects_json]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        subjects = json.loads(subjects_json)
        
        # Get uploaded files
        files = request.files.getlist('omrSheets')
        if not files:
            return jsonify({'error': 'No files uploaded'}), 400
        
        processor = OMRProcessor()
        processed_subjects = []
        
        # Process each subject's OMR sheet
        for i, subject in enumerate(subjects):
            subject_result = {
                'subject': subject['subjectName'],
                'teacherName': subject['teacherName'],
                'percentage': 0,
                'isUploaded': False
            }
            
            # Check if there's a corresponding file for this subject
            if i < len(files) and files[i].filename:
                file = files[i]
                
                if file and allowed_file(file.filename):
                    # Save uploaded file
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    
                    try:
                        # Process the OMR sheet
                        if filename.lower().endswith('.pdf'):
                            # Convert PDF to images and process first page
                            images = processor.convert_pdf_to_images(filepath)
                            if images:
                                # Save first page as temporary image
                                temp_img_path = filepath.replace('.pdf', '_page1.jpg')
                                cv2.imwrite(temp_img_path, cv2.cvtColor(images[0], cv2.COLOR_RGB2BGR))
                                result = processor.process_image_file(temp_img_path)
                                os.remove(temp_img_path)  # Clean up temp file
                            else:
                                result = {'success': False, 'error': 'Could not process PDF'}
                        else:
                            # Process image directly
                            result = processor.process_image_file(filepath)
                        
                        if result['success']:
                            # Calculate overall percentage from ratings
                            avg_rating = result['overall_score']
                            percentage = (avg_rating / 5) * 100
                            
                            subject_result.update({
                                'percentage': round(percentage, 1),
                                'isUploaded': True,
                                'ratings': result['ratings'],
                                'confidence': result['confidence']
                            })
                        else:
                            logger.error(f"Processing failed for {filename}: {result.get('error', 'Unknown error')}")
                            # Set default values for failed processing
                            subject_result.update({
                                'percentage': 75.0,  # Default percentage
                                'isUploaded': True,
                                'error': result.get('error', 'Processing failed')
                            })
                        
                        # Clean up uploaded file
                        os.remove(filepath)
                        
                    except Exception as e:
                        logger.error(f"Error processing file {filename}: {e}")
                        subject_result.update({
                            'percentage': 75.0,  # Default percentage  
                            'isUploaded': True,
                            'error': str(e)
                        })
                        
                        # Clean up file if it exists
                        if os.path.exists(filepath):
                            os.remove(filepath)
            
            processed_subjects.append(subject_result)
        
        # Save to database
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO result (batch_code, phase, total_students, subjects,percentage,remarks)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (batch_code) DO UPDATE SET
                    phase = EXCLUDED.phase,
                    total_students = EXCLUDED.total_students,
                    subjects = EXCLUDED.subjects,
                    updated_at = CURRENT_TIMESTAMP
                """, (batch_code, phase, int(total_students), json.dumps(processed_subjects)))
                
                conn.commit()
                cursor.close()
                conn.close()
                
                logger.info(f"Successfully saved batch {batch_code} to database")
                
            except Exception as e:
                logger.error(f"Database error: {e}")
                conn.rollback()
                conn.close()
        
        return jsonify({
            'message': 'OMR sheets processed successfully',
            'batchCode': batch_code,
            'subjects': processed_subjects
        })
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/results/<batch_code>', methods=['GET'])
def get_results(batch_code):
    try:
        logger.info(f"Fetching results for batch code: {batch_code}")
        conn = get_db_connection()
        if not conn:
            logger.error("Database connection failed")
            return jsonify({'error': 'Database connection failed', 'details': 'Could not establish database connection'}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT batch_code, phase, total_students, subjects, created_at
            FROM result 
            WHERE batch_code = %s
        """, (batch_code,))
        
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            logger.info(f"No results found for batch code: {batch_code}")
            return jsonify({'error': 'Batch not found', 'message': f'No results found for batch code {batch_code}'}), 404
        
        # Convert the results to JSON-safe format
        response_data = {
            'batchCode': result['batch_code'],
            'phase': result['phase'],
            'totalStudents': result['total_students'],
            'subjects': result['subjects'],
            'createdAt': result['created_at'].isoformat(),
            'dataSource': 'database'
        }
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching results: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/excel/<batch_code>', methods=['GET'])
def export_excel(batch_code):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT batch_code, phase, total_students, subjects
            FROM result 
            WHERE batch_code = %s
        """, (batch_code,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Batch not found'}), 404
        
        # Create CSV content
        csv_content = "Subject,Teacher Name,Percentage,Status\n"
        for subject in result['subjects']:
            status = "Uploaded" if subject.get('isUploaded', False) else "Not Uploaded"
            csv_content += f"{subject['subject']},{subject['teacherName']},{subject['percentage']},{status}\n"
        
        # Create a temporary file for download
        temp_file = io.BytesIO()
        temp_file.write(csv_content.encode('utf-8'))
        temp_file.seek(0)
        
        return send_file(
            temp_file,
            as_attachment=True,
            download_name=f"{batch_code}_results.csv",
            mimetype='text/csv'
        )
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = "connected"
        else:
            db_status = "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/batches', methods=['POST'])
def create_batch():
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            INSERT INTO result (batch_code, phase, total_students, subjects)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """, (data['batchCode'], data['description'], data['totalStudents'], json.dumps(data['subjects'])))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify(result), 201
    except Exception as e:
        logger.error(f"Error creating batch: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload/<batch_code>', methods=['POST'])
def upload_files(batch_code):
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files uploaded'}), 400

        files = request.files.getlist('files')
        if not files:
            return jsonify({'error': 'No files selected'}), 400

        uploaded_files = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                uploaded_files.append({
                    'filename': filename,
                    'filepath': filepath
                })

                # Process OMR in background
                processor = OMRProcessor()
                results = processor.process_image(filepath)  # You'll need to implement this method
                
                # Store results in database
                conn = get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE result 
                        SET subjects = subjects || jsonb_build_object('results', %s::jsonb) 
                        WHERE batch_code = %s
                    """, (json.dumps([{'filename': filename, 'results': results}]), batch_code))
                    conn.commit()
                    cursor.close()
                    conn.close()

        return jsonify({
            'message': f'Successfully uploaded {len(uploaded_files)} files',
            'files': uploaded_files
        }), 201

    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)