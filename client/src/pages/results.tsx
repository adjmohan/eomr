import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'wouter';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Download, 
  FileText, 
  Printer, 
  ArrowLeft,
  Home
} from 'lucide-react';

const ResultsPage = () => {
  const { batchCode } = useParams();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/results/${batchCode}`);
      setResults(response.data);
      
      // Show success message with data source info
      if (response.data.dataSource === 'database') {
        toast.success('Results loaded from database');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch results';
      setError(errorMessage);
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
      link.setAttribute('download', `${batchCode}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export to CSV');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const getSubjectColor = (subject) => {
    const colors = {
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

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { level: 'Excellent', color: '#10b981' };
    if (percentage >= 80) return { level: 'Very Good', color: '#3b82f6' };
    if (percentage >= 70) return { level: 'Good', color: '#f59e0b' };
    if (percentage >= 60) return { level: 'Average', color: '#f97316' };
    return { level: 'Needs Improvement', color: '#ef4444' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-6">No results found for batch code: {batchCode}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Code: {results.batchCode}</h1>
              <p className="text-lg text-gray-600 mt-2">
                Phase: {results.phase} • Total Students: {results.totalStudents}
              </p>
              {results.dataSource && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    📊 Database
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home size={16} />
                Home
              </button>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {results.subjects.map((subject, index) => {
            const performance = getPerformanceLevel(subject.percentage);
            const isUploaded = subject.isUploaded !== false;
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-lg p-6 border-l-4"
                style={{ 
                  borderLeftColor: isUploaded ? getSubjectColor(subject.subject) : '#e5e7eb'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{subject.subject}</h3>
                    <p className="text-sm text-gray-600">Teacher: {subject.teacherName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!isUploaded && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        Not Uploaded
                      </span>
                    )}
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        backgroundColor: isUploaded ? (performance.color + '20') : '#f3f4f6', 
                        color: isUploaded ? performance.color : '#6b7280'
                      }}
                    >
                      {isUploaded ? performance.level : 'No Data'}
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${subject.percentage}%`,
                        backgroundColor: isUploaded ? getSubjectColor(subject.subject) : '#d1d5db'
                      }}
                    ></div>
                  </div>
                  <div className="text-right">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: isUploaded ? getSubjectColor(subject.subject) : '#6b7280' }}
                    >
                      {subject.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Subject Analysis</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">📊 Rating System:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span><strong>Excellent:</strong> 5 points (90%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span><strong>Good:</strong> 3 points (70-89%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span><strong>Poor:</strong> 1 point (Below 70%)</span>
              </div>
            </div>
            <p className="text-blue-800 text-sm mt-3">
              💡 <strong>Any marking style accepted:</strong> Ticks, crosses, shading, filled shapes, underlines, or any creative marking!
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Subject</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Percentage</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Teacher Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Performance Level</th>
                </tr>
              </thead>
              <tbody>
                {results.subjects.map((subject, index) => {
                  const isUploaded = subject.isUploaded !== false;
                  const performance = getPerformanceLevel(subject.percentage);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: isUploaded ? getSubjectColor(subject.subject) : '#d1d5db' 
                            }}
                          ></div>
                          <span className="font-medium">{subject.subject}</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: isUploaded ? '#dcfce7' : '#f3f4f6',
                            color: isUploaded ? '#166534' : '#6b7280'
                          }}
                        >
                          {isUploaded ? 'Processed' : 'Not Uploaded'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="text-lg font-semibold">{subject.percentage}%</span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {subject.teacherName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{ 
                            backgroundColor: isUploaded ? (performance.color + '20') : '#f3f4f6', 
                            color: isUploaded ? performance.color : '#6b7280'
                          }}
                        >
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
    </div>
  );
};

export default ResultsPage;