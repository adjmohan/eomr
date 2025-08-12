import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Download, 
  Flag, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3,
  Image as ImageIcon
} from "lucide-react";

interface ResultModalProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ResultModal({ sheetId, isOpen, onClose }: ResultModalProps) {
  const { data: sheet, isLoading } = useQuery({
    queryKey: ['/api/sheets', sheetId],
    enabled: isOpen && !!sheetId,
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i + 1 <= rating;
      const halfFilled = i + 0.5 === rating;
      return (
        <Star
          key={i}
          className={`h-4 w-4 ${
            filled ? 'text-yellow-400 fill-current' : 
            halfFilled ? 'text-yellow-400 fill-current' : 
            'text-gray-300'
          }`}
        />
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-success';
      case 'review_needed': return 'text-accent';
      case 'failed': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
            <span>Loading sheet details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!sheet) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <p className="text-text-secondary">Sheet not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const responses = sheet.responses || [];
  const metadata = sheet.metadata || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Scan Results - {sheet.studentId}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sheet Information */}
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                OMR Sheet Information
              </h4>
              
              {/* Placeholder for original image */}
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Original OMR Sheet</p>
                  <p className="text-xs text-text-secondary">{sheet.fileName}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Student ID:</span>
                  <span className="text-text-primary font-medium">{sheet.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">File Name:</span>
                  <span className="text-text-primary">{sheet.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Processing Status:</span>
                  <Badge 
                    className={`${getStatusColor(sheet.status)}`}
                    variant={sheet.status === 'processed' ? 'default' : 'secondary'}
                  >
                    {sheet.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Scan Quality:</span>
                  <span className="text-success font-medium">
                    {metadata.imageQuality ? `${Math.round(metadata.imageQuality * 100)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Processing Time:</span>
                  <span className="text-text-primary">
                    {sheet.processingTime ? `${sheet.processingTime}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Confidence Level:</span>
                  <span className="text-primary font-medium">
                    {sheet.confidence ? `${Math.round(Number(sheet.confidence) * 100)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Feedback Responses
              </h4>
              
              <div className="space-y-4">
                {responses.length > 0 ? responses.map((response: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-text-primary text-sm">
                        {response.questionText || `Question ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(response.response || 0)}
                        </div>
                        <span className="text-sm font-medium">
                          {response.response || 'N/A'}/5
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary">
                      Detected mark: Circle {response.response || 'N/A'} • 
                      Confidence: {response.confidence ? `${Math.round(response.confidence * 100)}%` : 'N/A'}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-text-secondary">No response data available</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {sheet.overallScore && (
                <div className="mt-6 p-4 bg-primary bg-opacity-10 rounded-lg">
                  <h5 className="font-medium text-primary mb-3">Overall Analysis</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Average Score:</span>
                      <div className="text-lg font-bold text-primary">
                        {sheet.overallScore}/5
                      </div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Confidence Level:</span>
                      <div className="text-lg font-bold text-success">
                        {sheet.confidence ? `${Math.round(Number(sheet.confidence) * 100)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Assessment */}
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">
                      {Number(sheet.overallScore) >= 4 ? 'Excellent Performance' : 
                       Number(sheet.overallScore) >= 3 ? 'Good Performance' : 
                       'Needs Improvement'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline">
            <Flag className="h-4 w-4 mr-2" />
            Flag for Review
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Result
          </Button>
          <Button className="bg-primary hover:bg-primary-dark">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Verified
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
