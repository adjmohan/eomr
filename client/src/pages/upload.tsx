import React, { useState } from "react";
import { useLocation } from "wouter";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Upload,
  FileText,
  Plus,
  Minus,
  ArrowRight,
  BookOpen,
  Image,
} from "lucide-react";

const UploadPage = () => {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    batchCode: "",
    phase: "",
    totalStudents: 0,
  });

  const [subjects, setSubjects] = useState([
    { subjectName: "", teacherName: "" },
    { subjectName: "", teacherName: "" },
    { subjectName: "", teacherName: "" },
    { subjectName: "", teacherName: "" },
  ]);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // OMR Sheet validation - only allow specific OMR format
  const validateOMRSheet = (file: File): boolean => {
    // Basic file type validation for OMR sheets
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

    const isValidType = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    // Size validation for OMR sheets (must be reasonable size)
    const isReasonableSize =
      file.size >= 50 * 1024 && file.size <= 15 * 1024 * 1024; // 50KB to 15MB

    return isValidType && isValidExtension && isReasonableSize;
  };

  const onDrop = (acceptedFiles: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    acceptedFiles.forEach((file) => {
      if (validateOMRSheet(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });

    // Show detailed error for invalid files
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((f) => f.name).join(", ");
      toast.error(
        `❌ Invalid OMR sheets rejected: ${invalidFileNames}. Please upload only OMR format sheets (PDF/JPG/PNG, 50KB-15MB).`
      );
    }

    // Show success for valid files
    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success(`✅ ${validFiles.length} OMR sheet(s) added successfully`);
    }

    // Show summary
    if (validFiles.length > 0 || invalidFiles.length > 0) {
      console.log(
        `📁 OMR validation: ${validFiles.length} valid, ${invalidFiles.length} invalid`
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    multiple: true,
    maxSize: 15 * 1024 * 1024, // 15MB max file size
    minSize: 50 * 1024, // 50KB min file size
    validator: (file) => {
      if (!validateOMRSheet(file)) {
        return {
          code: "invalid-omr-format",
          message: `❌ Only OMR format sheets are allowed. Please upload valid OMR sheets (PDF/JPG/PNG).`,
        };
      }
      return null;
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalStudents" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubjectChange = (
    index: number,
    field: "subjectName" | "teacherName",
    value: string
  ) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subjectName: "", teacherName: "" }]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  const validateSubjects = (subjectsList: typeof subjects) => {
    const validSubjects = subjectsList.filter(
      (subject) => subject.subjectName.trim() && subject.teacherName.trim()
    );

    // Check for duplicate subjects
    const subjectNames = validSubjects.map((s) =>
      s.subjectName.toLowerCase().trim()
    );
    const uniqueSubjectNames = [...new Set(subjectNames)];

    if (subjectNames.length !== uniqueSubjectNames.length) {
      const duplicates = subjectNames.filter(
        (name, index) => subjectNames.indexOf(name) !== index
      );
      toast.error(
        `Duplicate subjects detected: ${[...new Set(duplicates)].join(
          ", "
        )}. Please remove duplicates.`
      );
      return null;
    }

    return validSubjects;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.batchCode || !formData.phase || !formData.totalStudents) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validSubjects = validateSubjects(subjects);

    if (validSubjects === null) {
      return; // Validation failed
    }

    if (validSubjects.length === 0) {
      toast.error("Please add at least one subject with both name and teacher");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one OMR sheet");
      return;
    }

    setIsUploading(true);
    const uploadToastId = toast.loading("Starting OMR processing...");

    try {
      // Transform subjects to the expected format
      const transformedSubjects = validSubjects.map(subject => ({
        subject: subject.subjectName,
        teacherName: subject.teacherName,
        percentage: 0,
        isUploaded: false
      }));

      // Create batch first
      try {
        const batchResponse = await axios.post("/api/batches", {
          batchCode: formData.batchCode,
          name: `Batch ${formData.batchCode}`,
          description: formData.phase,
          totalStudents: formData.totalStudents,
          subjects: transformedSubjects,
        });
      } catch (error: any) {
        console.error("Error creating batch:", error);
        toast.error(error.response?.data?.error || "Failed to create batch");
        throw error;
      }

      // Then upload files
      const uploadFormData = new FormData();
      uploadFormData.append("batchCode", formData.batchCode);
      uploadedFiles.forEach((file) => {
        uploadFormData.append("files", file);
      });

      const response = await axios.post(
        `/api/upload/${formData.batchCode}`,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              toast.loading(
                `Processing OMR sheets... ${percentCompleted}%`,
                { id: uploadToastId }
              );
            }
          },
        }
      );

      toast.dismiss(uploadToastId);
      console.log("✅ OMR processing successful:", response.data);
      toast.success("OMR sheets processed successfully!");

      // Navigate to results page
      navigate(`/results/${formData.batchCode}`);
    } catch (error: any) {
      toast.dismiss(uploadToastId);
      console.error("OMR processing error:", error);
      toast.error(
        error.response?.data?.message || "Failed to process OMR sheets"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      batchCode: "",
      phase: "",
      totalStudents: 0,
    });
    setSubjects([
      { subjectName: "", teacherName: "" },
      { subjectName: "", teacherName: "" },
      { subjectName: "", teacherName: "" },
      { subjectName: "", teacherName: "" },
    ]);
    setUploadedFiles([]);
    toast.success("Form reset successfully");
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success("OMR sheet removed");
  };

  return (
    <div className="upload-page">
      <Toaster position="top-right" />

      <div className="main-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>EduFeedback Analytics</h1>
            <p>Real-time OMR Analysis System</p>
          </div>
          <div className="header-action">
            <button className="dashboard-btn" data-testid="button-dashboard">
              <ArrowRight size={16} />
              Dashboard
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="upload-form-container">
          <div className="form-header">
            <Upload size={24} />
            <h2>Upload OMR Sheet for Analysis</h2>
            <p>
              Upload student feedback OMR sheets and enter batch details for
              comprehensive analysis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">
            {/* Batch Information */}
            <div className="form-row">
              <div className="form-group">
                <label>Batch Code *</label>
                <input
                  type="text"
                  name="batchCode"
                  value={formData.batchCode}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH2024A1"
                  required
                  data-testid="input-batch-code"
                />
              </div>
              <div className="form-group">
                <label>Phase *</label>
                <input
                  type="text"
                  name="phase"
                  value={formData.phase}
                  onChange={handleInputChange}
                  placeholder="e.g., Phase 1, Semester 2, etc."
                  required
                  data-testid="input-phase"
                />
              </div>
              <div className="form-group">
                <label>Total Students *</label>
                <input
                  type="number"
                  name="totalStudents"
                  value={formData.totalStudents}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="1"
                  required
                  data-testid="input-total-students"
                />
              </div>
            </div>

            {/* Subjects Section */}
            <div className="subjects-section">
              <div className="section-header">
                <BookOpen size={20} />
                <span>Subjects</span>
                <button
                  type="button"
                  onClick={addSubject}
                  className="add-subject-btn"
                  data-testid="button-add-subject"
                >
                  <Plus size={16} />
                  Add Subject
                </button>
              </div>

              {subjects.map((subject, index) => {
                const isDuplicate =
                  subjects.filter(
                    (s) =>
                      s.subjectName.toLowerCase().trim() ===
                        subject.subjectName.toLowerCase().trim() &&
                      s.subjectName.trim() !== ""
                  ).length > 1;

                return (
                  <div key={index} className="subject-row">
                    <div className="subject-header">
                      <span>Subject {index + 1}</span>
                      {isDuplicate && (
                        <span
                          style={{
                            color: "#dc2626",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            marginLeft: "10px",
                          }}
                        >
                          ⚠️ Duplicate
                        </span>
                      )}
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="remove-subject-btn"
                          data-testid={`button-remove-subject-${index}`}
                        >
                          <Minus size={16} />
                        </button>
                      )}
                    </div>
                    <div className="subject-inputs">
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={subject.subjectName}
                        onChange={(e) =>
                          handleSubjectChange(index, "subjectName", e.target.value)
                        }
                        style={{
                          borderColor: isDuplicate ? "#dc2626" : "",
                        }}
                        data-testid={`input-subject-name-${index}`}
                      />
                      <input
                        type="text"
                        placeholder="Teacher Name"
                        value={subject.teacherName}
                        onChange={(e) =>
                          handleSubjectChange(index, "teacherName", e.target.value)
                        }
                        data-testid={`input-teacher-name-${index}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* File Upload Section */}
            <div className="upload-section">
              <div className="section-header">
                <Image size={20} />
                <span>OMR Sheet Upload</span>
              </div>

              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? "active" : ""}`}
                data-testid="dropzone-omr"
              >
                <input {...getInputProps()} />
                <div className="dropzone-content">
                  <Upload size={48} className="dropzone-icon" />
                  <h3>
                    {isDragActive
                      ? "Drop OMR sheets here..."
                      : "Drag & drop OMR sheets here"}
                  </h3>
                  <p>or click to browse files</p>
                  <div className="file-types">
                    <span>Supported: PDF, JPG, PNG</span>
                    <span>Max size: 15MB per file</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <h4>Uploaded OMR Sheets ({uploadedFiles.length})</h4>
                  <div className="file-list">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="file-item"
                        data-testid={`file-item-${index}`}
                      >
                        <div className="file-info">
                          <FileText size={20} />
                          <div>
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="remove-file-btn"
                          data-testid={`button-remove-file-${index}`}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={resetForm}
                className="reset-btn"
                disabled={isUploading}
                data-testid="button-reset"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isUploading || uploadedFiles.length === 0}
                data-testid="button-submit"
              >
                {isUploading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight size={20} />
                    Process OMR Sheets
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;