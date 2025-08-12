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

  const onDrop = (acceptedFiles: File[]) => {
    // File validation
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

    const validFiles = [];
    const invalidFiles = [];

    acceptedFiles.forEach((file) => {
      const isValidType = allowedTypes.includes(file.type);
      const isValidExtension = allowedExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      // Size validation
      const isReasonableSize =
        file.size >= 1024 && file.size <= 10 * 1024 * 1024; // 1KB to 10MB

      if (isValidType && isValidExtension && isReasonableSize) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });

    // Show detailed error for invalid files
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((f) => f.name).join(", ");
      toast.error(
        `❌ Invalid files rejected: ${invalidFileNames}. Please upload PDF or image files (JPG, JPEG, PNG) between 1KB and 10MB.`
      );
    }

    // Show success for valid files
    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success(`✅ ${validFiles.length} file(s) added successfully`);
    }

    // Show summary
    if (validFiles.length > 0 || invalidFiles.length > 0) {
      console.log(
        `📁 File validation: ${validFiles.length} valid, ${invalidFiles.length} invalid`
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
    maxSize: 10 * 1024 * 1024, // 10MB max file size
    minSize: 1024, // 1KB min file size
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subjectName: "", teacherName: "" }]);
  };

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  const validateSubjects = (subjectsList) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.batchCode || !formData.phase || !formData.totalStudents) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validSubjects = validateSubjects(subjects);

    if (validSubjects === null) {
      return; // Validation failed, subjects were not submitted
    }

    if (validSubjects.length === 0) {
      toast.error("Please add at least one subject with both name and teacher");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one OMR sheet image");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append("batchCode", formData.batchCode);
      uploadFormData.append("phase", formData.phase);
      uploadFormData.append("totalStudents", formData.totalStudents);
      uploadFormData.append("subjects", JSON.stringify(validSubjects));

      uploadedFiles.forEach((file, index) => {
        uploadFormData.append(`omrSheets`, file);
      });

      const response = await axios.post("http://localhost:5001/api/upload-omr", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          toast.loading(`Uploading... ${percentCompleted}%`, { id: "upload" });
        },
      });

      toast.dismiss("upload");
      console.log("✅ Upload successful:", response.data);
      toast.success("OMR sheets processed successfully!");

      // Navigate to results page
      navigate(`/results/${formData.batchCode}`);
    } catch (error) {
      toast.dismiss("upload");
      console.error("Upload error:", error);
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

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success("File removed");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EduFeedback Analytics
          </h1>
          <p className="text-xl text-gray-600">Real-time OMR Analysis System</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload size={24} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Upload OMR Sheet for Analysis
              </h2>
              <p className="text-gray-600">
                Upload student feedback OMR sheets and enter batch details for
                comprehensive analysis
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Code *
                </label>
                <input
                  type="text"
                  name="batchCode"
                  value={formData.batchCode}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH2024A1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phase *
                </label>
                <input
                  type="text"
                  name="phase"
                  value={formData.phase}
                  onChange={handleInputChange}
                  placeholder="e.g., Phase 1, Semester 2, etc."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Students *
                </label>
                <input
                  type="number"
                  name="totalStudents"
                  value={formData.totalStudents}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Subjects Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">Subjects</span>
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Subject
                </button>
              </div>

              {subjects.map((subject, index) => {
                const isDuplicate =
                  subjects.filter(
                    (s, i) =>
                      s.subjectName.toLowerCase().trim() ===
                        subject.subjectName.toLowerCase().trim() &&
                      s.subjectName.trim() !== ""
                  ).length > 1;

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">
                        Subject {index + 1}
                        {isDuplicate && (
                          <span className="text-red-600 text-sm ml-2">
                            ⚠️ Duplicate
                          </span>
                        )}
                      </span>
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject Name
                        </label>
                        <input
                          type="text"
                          value={subject.subjectName}
                          onChange={(e) =>
                            handleSubjectChange(index, "subjectName", e.target.value)
                          }
                          placeholder="e.g., Mathematics, Physics"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teacher Name
                        </label>
                        <input
                          type="text"
                          value={subject.teacherName}
                          onChange={(e) =>
                            handleSubjectChange(index, "teacherName", e.target.value)
                          }
                          placeholder="Enter teacher name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload OMR Sheets
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop OMR sheets here, or click to select files
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, JPG, JPEG, PNG (Max 10MB per file)
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-blue-600" />
                          <span className="text-sm text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Process OMR Sheets
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;