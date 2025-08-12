# OMR Scan Pro - Student Feedback Analytics System

A comprehensive web application for Optical Mark Recognition (OMR) processing with real-time analytics and database storage.

## 🚀 Features

- **Real-time OMR Processing**: Advanced OpenCV-based scanning and analysis
- **Full-page Website Design**: Modern, responsive UI with gradient backgrounds
- **Database Storage**: PostgreSQL integration for persistent data storage
- **Export Capabilities**: Export results to Excel and HTML/PDF formats
- **File Validation**: Strict OMR format validation (only allows specific OMR sheets)
- **Batch Management**: Process multiple OMR sheets with batch tracking
- **Analytics Dashboard**: Comprehensive subject-wise performance analysis

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **Wouter** for lightweight routing
- **React Dropzone** for drag-and-drop file uploads
- **Axios** for API communication
- **React Hot Toast** for notifications

### Backend
- **Python Flask** for API server
- **OpenCV** for computer vision and OMR processing
- **PostgreSQL** with psycopg2 for database operations
- **pdf2image** for PDF processing
- **Pillow** for image manipulation
- **Flask-CORS** for cross-origin requests

## 📦 Installation Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **PostgreSQL** database

### 1. Clone the Repository
```bash
git clone <repository-url>
cd omr-scan-pro
```

### 2. Install Python Dependencies
```bash
# Install Python packages
pip install flask
pip install flask-cors
pip install opencv-python
pip install pdf2image
pip install pillow
pip install psycopg2-binary
pip install numpy
pip install python-dotenv
```

### 3. Install Node.js Dependencies
```bash
# Install all frontend and backend Node.js packages
npm install

# Or install specific packages if needed:
npm install react react-dom typescript vite @vitejs/plugin-react
npm install tailwindcss autoprefixer postcss
npm install axios react-router-dom react-dropzone
npm install lucide-react react-hot-toast
npm install @radix-ui/react-select @radix-ui/react-dialog
npm install wouter
```

### 4. Database Setup
Make sure you have PostgreSQL installed and running:

```bash
# Create database (if not already created)
createdb omr

# The application will automatically create the required tables:
# - result table with columns: id, batch_code, phase, total_students, subjects, processing_results, created_at
```

### 5. Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/omr
PGHOST=localhost
PGPORT=5432
PGDATABASE=omr
PGUSER=your_username
PGPASSWORD=your_password
```

## 🚀 Running the Application

### Start Both Servers

1. **Start the Flask Backend** (Port 5001):
```bash
python app.py
```

2. **Start the React Frontend** (Port 5000):
```bash
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5001

## 📋 Usage Instructions

### 1. Upload OMR Sheets
- Navigate to the upload page
- Fill in batch information (Batch Code, Phase, Total Students)
- Add subjects with teacher names
- Drag and drop OMR sheet files (PDF, JPG, PNG only)
- Click "Process OMR Sheets"

### 2. View Results
- After processing, you'll be redirected to the results page
- View subject-wise performance cards
- Check detailed analytics table
- Export results to Excel or HTML/PDF

### 3. File Validation
The system only accepts:
- **File Types**: PDF, JPG, JPEG, PNG
- **File Size**: 50KB to 15MB
- **OMR Format**: Files must contain OMR-related keywords or patterns
- **Quality**: Minimum resolution for proper scanning

## 🔧 API Endpoints

### Flask Backend (Port 5001)
- `POST /api/upload-omr` - Upload and process OMR sheets
- `GET /api/results/{batchCode}` - Get processing results
- `GET /api/export/excel/{batchCode}` - Export to Excel
- `GET /api/export/pdf/{batchCode}` - Export to HTML/PDF
- `GET /api/health` - Health check endpoint

## 📊 Database Schema

### Result Table
```sql
CREATE TABLE result (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    phase VARCHAR(100) NOT NULL,
    total_students INTEGER NOT NULL,
    subjects JSONB NOT NULL,
    processing_results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 OMR Processing Features

- **Advanced Computer Vision**: Real OpenCV-based bubble detection
- **Multiple Mark Types**: Supports various marking styles (fills, crosses, checkmarks)
- **Confidence Scoring**: Provides accuracy metrics for each detection
- **Batch Processing**: Handle multiple sheets simultaneously
- **Error Handling**: Comprehensive validation and error reporting

## 🛡️ File Security

- **Type Validation**: Only specific file types allowed
- **Size Limits**: Prevents oversized file uploads
- **OMR Format Check**: Validates files contain OMR patterns
- **Sanitization**: File names and content are sanitized

## 📱 Responsive Design

- **Full-page Layout**: Modern website design (not form-style)
- **Mobile Friendly**: Works on all device sizes
- **Progressive UI**: Beautiful gradients and animations
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify connection string in environment variables
   - Ensure database 'omr' exists

2. **File Upload Failed**
   - Check file format (only PDF, JPG, PNG allowed)
   - Verify file size (50KB - 15MB)
   - Ensure files contain OMR-related content

3. **Processing Errors**
   - Check Flask backend is running on port 5001
   - Verify OpenCV installation
   - Check file permissions in uploads directory

### Performance Tips

- **Optimize Images**: Compress large files before upload
- **Batch Size**: Process 10-20 sheets at a time for best performance
- **Database**: Regular maintenance and indexing
- **Memory**: Ensure sufficient RAM for image processing

## 📈 Future Enhancements

- Machine learning integration for better accuracy
- Advanced analytics and reporting
- Multi-language support
- Cloud storage integration
- Real-time collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Check the troubleshooting section above
- Review the API documentation
- Ensure all dependencies are properly installed
- Verify database connections and file permissions

---

**Note**: This application requires both Python Flask backend and React frontend to be running simultaneously for full functionality.