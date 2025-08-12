import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  batchCode: string;
}

export function ProcessingStatus({ batchCode }: ProcessingStatusProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/processing-status', batchCode],
    refetchInterval: 2000,
    enabled: !!batchCode,
  });

  if (isLoading || !status) {
    return (
      <Card className="shadow-material-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading processing status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalSheets, statusCounts, isComplete } = status;
  const processed = statusCounts.processed || 0;
  const failed = statusCounts.failed || 0;
  const pending = statusCounts.pending || 0;
  const reviewNeeded = statusCounts.review_needed || 0;
  
  const progressPercentage = totalSheets > 0 ? ((processed + failed + reviewNeeded) / totalSheets) * 100 : 0;

  const processingSteps = [
    {
      label: "Image preprocessing",
      status: "completed",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Detecting OMR marks",
      status: pending > 0 ? "processing" : "completed",
      icon: pending > 0 ? Loader2 : CheckCircle,
      color: pending > 0 ? "text-accent" : "text-success",
    },
    {
      label: "Calculating scores",
      status: isComplete ? "completed" : pending > 0 ? "pending" : "processing",
      icon: isComplete ? CheckCircle : pending > 0 ? Clock : Loader2,
      color: isComplete ? "text-success" : pending > 0 ? "text-text-secondary" : "text-accent",
    },
  ];

  return (
    <Card className="shadow-material-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Loader2 className={`h-5 w-5 ${isComplete ? 'text-success' : 'text-accent animate-spin'}`} />
            Processing OMR Sheets - {batchCode}
          </CardTitle>
          {isComplete ? (
            <Badge className="bg-success text-white">Complete</Badge>
          ) : (
            <Badge variant="secondary" className="text-accent">
              Processing...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-text-primary">{totalSheets}</div>
            <div className="text-sm text-text-secondary">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-success">{processed}</div>
            <div className="text-sm text-text-secondary">Processed</div>
          </div>
          {reviewNeeded > 0 && (
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-accent">{reviewNeeded}</div>
              <div className="text-sm text-text-secondary">Review Needed</div>
            </div>
          )}
          {pending > 0 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{pending}</div>
              <div className="text-sm text-text-secondary">Pending</div>
            </div>
          )}
          {failed > 0 && (
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-error">{failed}</div>
              <div className="text-sm text-text-secondary">Failed</div>
            </div>
          )}
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          <h4 className="font-medium text-text-primary">Processing Steps</h4>
          {processingSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-success' : 
                  step.status === 'processing' ? 'bg-accent' : 'bg-gray-300'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    step.status === 'completed' ? 'text-white' : 
                    step.status === 'processing' ? 'text-white animate-spin' : 'text-gray-600'
                  }`} />
                </div>
                <span className={`${step.color} ${
                  step.status === 'processing' ? 'font-medium' : ''
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-sm text-text-secondary">
          <p>💡 <strong>Processing Info:</strong> Each OMR sheet undergoes image preprocessing, mark detection, and score calculation. Sheets with low confidence scores are flagged for manual review.</p>
        </div>
      </CardContent>
    </Card>
  );
}
