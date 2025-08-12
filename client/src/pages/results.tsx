import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ResultModal } from "@/components/result-modal";
import { 
  Download, 
  FileText, 
  Printer, 
  ArrowLeft,
  Eye,
  Filter,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  FileCheck
} from "lucide-react";

export default function ResultsPage() {
  const { batchCode } = useParams();
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['/api/results', batchCode],
    enabled: !!batchCode,
  });

  const handleExportExcel = async () => {
    if (!batchCode) return;
    
    try {
      const response = await fetch(`/api/export/excel/${batchCode}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${batchCode}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'review_needed':
        return <Badge variant="secondary" className="bg-orange-100 text-accent"><AlertTriangle className="h-3 w-3 mr-1" />Review Needed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Excellent', color: 'text-success' };
    if (score >= 4.0) return { level: 'Very Good', color: 'text-primary' };
    if (score >= 3.0) return { level: 'Good', color: 'text-accent' };
    if (score >= 2.0) return { level: 'Average', color: 'text-orange-600' };
    return { level: 'Needs Improvement', color: 'text-error' };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i + 1 <= rating;
      const halfFilled = i + 0.5 === rating;
      return (
        <Star
          key={i}
          className={`h-3 w-3 ${
            filled ? 'text-yellow-400 fill-current' : 
            halfFilled ? 'text-yellow-400 fill-current' : 
            'text-gray-300'
          }`}
        />
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Error Loading Results</h2>
        <p className="text-text-secondary">
          {error ? "Failed to fetch results" : `No results found for batch code: ${batchCode}`}
        </p>
        <Link href="/upload">
          <Button className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Button>
        </Link>
      </div>
    );
  }

  const filteredSheets = results.sheets.filter(sheet => 
    filterStatus === "all" || sheet.status === filterStatus
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-text-primary mb-2">
            Batch Results: {batchCode}
          </h1>
          <p className="text-text-secondary">
            Total Students: {results.totalSheets} • Processed: {results.processedSheets} • Average Score: {results.averageScore}/5
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Sheets</p>
                <p className="text-2xl font-bold text-text-primary">{results.totalSheets}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Successfully Processed</p>
                <p className="text-2xl font-bold text-success">{results.processedSheets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Needs Review</p>
                <p className="text-2xl font-bold text-accent">{results.needsReview}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold text-text-primary">{results.averageScore}/5</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Results Table */}
      <Card className="shadow-material-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Individual Results
            </CardTitle>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-primary focus:border-primary"
                data-testid="filter-status"
              >
                <option value="all">All Status</option>
                <option value="processed">Processed</option>
                <option value="review_needed">Needs Review</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Sheet Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Processed Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSheets.map((sheet) => {
                  const performance = getPerformanceLevel(Number(sheet.overallScore) || 0);
                  return (
                    <tr key={sheet.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {sheet.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {sheet.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${performance.color}`}>
                            {sheet.overallScore || 'N/A'}/5
                          </span>
                          {sheet.overallScore && (
                            <div className="flex">
                              {renderStars(Number(sheet.overallScore))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sheet.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {sheet.processedAt ? new Date(sheet.processedAt).toLocaleString() : 'Not processed'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSheet(sheet.id)}
                          className="text-primary hover:text-primary-dark"
                          data-testid={`button-view-details-${sheet.studentId}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredSheets.length === 0 && (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-text-secondary">No results match the current filter</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="text-center">
        <Link href="/upload">
          <Button variant="outline" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Upload New OMR Sheets
          </Button>
        </Link>
      </div>

      {/* Result Detail Modal */}
      {selectedSheet && (
        <ResultModal
          sheetId={selectedSheet}
          isOpen={!!selectedSheet}
          onClose={() => setSelectedSheet(null)}
        />
      )}
    </div>
  );
}
