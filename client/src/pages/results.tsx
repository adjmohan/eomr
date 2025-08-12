import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'wouter';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Download, 
  FileText, 
  Printer, 
  ArrowLeft
} from 'lucide-react';

interface Subject {
  subject: string;
  teacherName: string;
  percentage: number;
  isUploaded?: boolean;
}

interface ResultsData {
  batchCode: string;
  phase: string;
  totalStudents: number;
  subjects: Subject[];
  dataSource?: string;
  mongodbStatus?: string;
}

const ResultsPage = () => {
  const params = useParams();
  const batchCode = params.batchCode;
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/results/${batchCode}`);
      setResults(response.data);
      
      // Show success message with data source info
      if (response.data.dataSource === 'memory') {
        toast.success('Results loaded from temporary storage (database unavailable)');
      } else if (response.data.dataSource === 'database') {
        toast.success('Results loaded from database');
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch results';
      const suggestion = error.response?.data?.suggestion || '';
      setError(`${errorMessage}${suggestion ? ` - ${suggestion}` : ''}`);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [batchCode]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const exportToExcel = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/export/excel/${batchCode}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${batchCode}_results.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export to Excel');
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/export/pdf/${batchCode}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${batchCode}_results.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('HTML file downloaded successfully! Open it in your browser and use Ctrl+P to save as PDF.');
    } catch (error) {
      toast.error('Failed to export to HTML');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const getSubjectColor = (subject: string): string => {
    const colors: Record<string, string> = {
      physics: '#3b82f6',
      chemistry: '#10b981',
      maths: '#f59e0b',
      mathematics: '#f59e0b',
      english: '#8b5cf6',
      social: '#f97316',
      language: '#ec4899',
      mat: '#06b6d4',
      botany: '#84cc16',
      zoology: '#14b8a6',
      computer: '#ef4444',
      biology: '#84cc16',
      history: '#f97316',
      geography: '#10b981',
      economics: '#8b5cf6'
    };
    return colors[subject.toLowerCase()] || '#6b7280';
  };

  const getPerformanceLevel = (percentage: number): { level: string; color: string } => {
    if (percentage >= 90) return { level: 'Excellent', color: '#10b981' };
    if (percentage >= 80) return { level: 'Very Good', color: '#3b82f6' };
    if (percentage >= 70) return { level: 'Good', color: '#f59e0b' };
    if (percentage >= 60) return { level: 'Average', color: '#f97316' };
    return { level: 'Needs Improvement', color: '#ef4444' };
  };

  if (loading) {
    return (
      <div className="results-page">
        <Toaster position="top-right" />
        <div className="main-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <Toaster position="top-right" />
        <div className="main-container">
          <div className="error">
            <h2>Error Loading Results</h2>
            <p>{error}</p>
            <Link href="/" className="submit-btn" style={{ display: 'inline-block', marginTop: '20px' }} data-testid="link-back-upload">
              <ArrowLeft size={20} />
              Back to Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-page">
        <Toaster position="top-right" />
        <div className="main-container">
          <div className="error">
            <h2>No Results Found</h2>
            <p>No results found for batch code: {batchCode}</p>
            <Link href="/" className="submit-btn" style={{ display: 'inline-block', marginTop: '20px' }} data-testid="link-back-upload-no-results">
              <ArrowLeft size={20} />
              Back to Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <Toaster position="top-right" />
      
      <div className="main-container">
        {/* Header */}
        <div className="results-header">
          <div className="results-info">
            <h1 data-testid="text-batch-code">Batch Code: {results.batchCode}</h1>
            <p data-testid="text-batch-info">Phase: {results.phase} • Total Students: {results.totalStudents}</p>
            {results.dataSource && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                marginTop: '8px',
                fontSize: '0.9rem'
              }}>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  background: results.dataSource === 'database' ? '#dcfce7' : '#fef3c7',
                  color: results.dataSource === 'database' ? '#166534' : '#92400e'
                }} data-testid="status-data-source">
                  {results.dataSource === 'database' ? '📊 Database' : '💾 Memory'}
                </div>
                {results.mongodbStatus === 'disconnected' && (
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    background: '#fef2f2',
                    color: '#dc2626'
                  }} data-testid="status-database-offline">
                    ⚠️ Database Offline
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="export-buttons">
            <button onClick={exportToExcel} className="export-btn export-excel" data-testid="button-export-excel">
              <Download size={16} />
              Export to Excel
            </button>
            <button onClick={exportToPDF} className="export-btn export-pdf" data-testid="button-export-pdf">
              <FileText size={16} />
              Export to HTML
            </button>
            <button onClick={handlePrint} className="export-btn export-print" data-testid="button-print">
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="subjects-grid-results">
          {results.subjects.map((subject, index) => {
            const performance = getPerformanceLevel(subject.percentage);
            const isUploaded = subject.isUploaded !== false; // Default to true if not specified
            
            return (
              <div 
                key={index} 
                className={`subject-card ${subject.subject.toLowerCase()}`}
                style={{ 
                  '--subject-color': getSubjectColor(subject.subject),
                  opacity: isUploaded ? 1 : 0.6,
                  border: isUploaded ? '2px solid var(--subject-color)' : '2px solid #e5e7eb'
                } as React.CSSProperties}
                data-testid={`card-subject-${index}`}
              >
                <div className="subject-header">
                  <div>
                    <h3 className="subject-name" data-testid={`text-subject-name-${index}`}>{subject.subject}</h3>
                    <p className="teacher-name" data-testid={`text-teacher-name-${index}`}>Teacher: {subject.teacherName}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isUploaded && (
                      <div style={{
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500'
                      }} data-testid={`status-not-uploaded-${index}`}>
                        Not Uploaded
                      </div>
                    )}
                    <div style={{ 
                      padding: '8px 12px', 
                      background: isUploaded ? (performance.color + '20') : '#f3f4f6', 
                      color: isUploaded ? performance.color : '#6b7280',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }} data-testid={`status-performance-${index}`}>
                      {isUploaded ? performance.level : 'No Data'}
                    </div>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${subject.percentage}%`,
                      background: isUploaded ? 'var(--subject-color)' : '#d1d5db'
                    }}
                    data-testid={`progress-fill-${index}`}
                  ></div>
                </div>
                
                <div className="percentage" style={{ color: isUploaded ? 'inherit' : '#6b7280' }} data-testid={`text-percentage-${index}`}>
                  {subject.percentage}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Table */}
        <div className="summary-table">
          <h2>Detailed Subject Analysis</h2>
          <div style={{ 
            background: '#f8fafc', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>📊 Rating System:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                <span><strong>Excellent:</strong> 5 points (90%+)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                <span><strong>Good:</strong> 3 points (70-89%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                <span><strong>Poor:</strong> 1 point (Below 70%)</span>
              </div>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
              💡 <strong>Any marking style accepted:</strong> Ticks, crosses, shading, filled shapes, underlines, or any creative marking!
            </p>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Percentage</th>
                <th>Teacher Name</th>
                <th>Performance Level</th>
              </tr>
            </thead>
            <tbody>
              {results.subjects.map((subject, index) => {
                const isUploaded = subject.isUploaded !== false;
                const performance = getPerformanceLevel(subject.percentage);
                return (
                  <tr key={index} style={{ opacity: isUploaded ? 1 : 0.7 }} data-testid={`row-subject-${index}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            background: isUploaded ? getSubjectColor(subject.subject) : '#d1d5db' 
                          }}
                        ></div>
                        {subject.subject}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: isUploaded ? '#dcfce7' : '#f3f4f6',
                        color: isUploaded ? '#166534' : '#6b7280'
                      }}>
                        {isUploaded ? 'Processed' : 'Not Uploaded'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: isUploaded ? getSubjectColor(subject.subject) : '#6b7280' }}>
                      {subject.percentage}%
                    </td>
                    <td>{subject.teacherName}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: isUploaded ? (performance.color + '20') : '#f3f4f6',
                        color: isUploaded ? performance.color : '#6b7280'
                      }}>
                        {isUploaded ? performance.level : 'No Data'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;