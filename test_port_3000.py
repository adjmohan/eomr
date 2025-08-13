from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Test endpoint
@app.route('/test')
def test():
    return jsonify({'message': 'Server is working'})

# Health check endpoint
@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

# Results endpoint with test data
@app.route('/api/results/<batch_code>')
def get_results(batch_code):
    return jsonify({
        'batchCode': batch_code,
        'phase': 'Test Phase',
        'totalStudents': 30,
        'subjects': [
            {
                'subject': 'Mathematics',
                'teacherName': 'John Smith',
                'percentage': 85.5,
                'isUploaded': True
            }
        ]
    })

if __name__ == '__main__':
    print('Starting server on port 3000...')
    app.run(host='0.0.0.0', port=3000, debug=True)
