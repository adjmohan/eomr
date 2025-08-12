import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { ProcessingStatus } from "@/components/processing-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, FileText, Users, CheckCircle } from "lucide-react";

export default function UploadPage() {
  const [batchCode, setBatchCode] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingBatch, setProcessingBatch] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate random batch code
  const generateBatchCode = () => {
    const code = `OMR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setBatchCode(code);
    setBatchName(`Batch ${code}`);
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { files: File[]; batchCode: string }) => {
      const formData = new FormData();
      data.files.forEach(file => formData.append('files', file));
      
      const response = await apiRequest('POST', `/api/upload/${data.batchCode}`, formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `${data.sheets.length} files uploaded and processing started`,
      });
      setIsProcessing(true);
      setProcessingBatch(data.batch.batchCode);
      setUploadedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Processing status query
  const { data: processingStatus } = useQuery({
    queryKey: ['/api/processing-status', processingBatch],
    enabled: !!processingBatch && isProcessing,
    refetchInterval: 2000,
  });

  // Stop polling when processing is complete
  if (processingStatus?.isComplete && isProcessing) {
    setIsProcessing(false);
    toast({
      title: "Processing Complete",
      description: `All ${processingStatus.totalSheets} sheets have been processed`,
    });
  }

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
    if (!batchCode) {
      generateBatchCode();
    }
  };

  const handleUpload = () => {
    if (!batchCode || uploadedFiles.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a batch code and select files to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ files: uploadedFiles, batchCode });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary-light bg-opacity-10 rounded-full flex items-center justify-center">
          <CloudUpload className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-medium text-text-primary mb-2">Upload OMR Sheets</h1>
          <p className="text-text-secondary">Upload student feedback OMR sheets for automated scanning and analysis</p>
        </div>
      </div>

      {/* Batch Information */}
      <Card className="shadow-material-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Batch Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchCode">Batch Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="batchCode"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="e.g., OMR-2024-001"
                  data-testid="input-batch-code"
                />
                <Button 
                  variant="outline" 
                  onClick={generateBatchCode}
                  data-testid="button-generate-batch-code"
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchName">Batch Name</Label>
              <Input
                id="batchName"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Mid-term Feedback 2024"
                data-testid="input-batch-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batchDescription">Description (Optional)</Label>
            <Textarea
              id="batchDescription"
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              placeholder="Add any additional notes about this batch..."
              rows={3}
              data-testid="textarea-batch-description"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="shadow-material-2">
        <CardContent className="p-8">
          <FileUpload onFilesSelected={handleFilesSelected} />
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadedFiles.length > 0 && (
        <Card className="shadow-material-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Upload Queue ({uploadedFiles.length} files)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light bg-opacity-10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{file.name}</p>
                      <p className="text-sm text-text-secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="bg-primary hover:bg-primary-dark"
                data-testid="button-upload-start"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Start Upload & Processing
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && processingBatch && (
        <ProcessingStatus batchCode={processingBatch} />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Supported Formats</p>
                <p className="text-2xl font-bold text-text-primary">JPG, PNG, PDF</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Max File Size</p>
                <p className="text-2xl font-bold text-text-primary">10 MB</p>
              </div>
              <CloudUpload className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Processing Speed</p>
                <p className="text-2xl font-bold text-text-primary">~2-5 sec</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
