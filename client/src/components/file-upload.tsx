import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUpload({ onFilesSelected }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => 
        file.errors.map((error: any) => error.message).join(", ")
      );
      setError(`Some files were rejected: ${errors.join(", ")}`);
    }

    if (acceptedFiles.length > 0) {
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }
  }, [selectedFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary bg-opacity-5"
            : "border-gray-300 hover:border-primary"
        }`}
        data-testid="file-drop-zone"
      >
        <input {...getInputProps()} />
        <div className="mx-auto w-16 h-16 bg-primary-light bg-opacity-10 rounded-full flex items-center justify-center mb-4">
          <CloudUpload className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          {isDragActive ? "Drop files here..." : "Drop OMR sheets here or click to browse"}
        </h3>
        <p className="text-text-secondary mb-4">Support for JPG, PNG, PDF files up to 10MB each</p>
        <Button 
          type="button"
          className="bg-primary hover:bg-primary-dark"
          data-testid="button-browse-files"
        >
          <CloudUpload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">
              Selected Files ({selectedFiles.length})
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              data-testid="button-clear-files"
            >
              Clear All
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                data-testid={`file-item-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light bg-opacity-10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{file.name}</p>
                    <p className="text-xs text-text-secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-error hover:text-error hover:bg-red-50"
                  data-testid={`button-remove-file-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
