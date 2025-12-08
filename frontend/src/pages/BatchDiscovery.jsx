import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { batchService } from "../services/batch";
import FileUploader from "../components/batch/FileUploader";
import BatchProgress from "../components/batch/BatchProgress";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  ArrowLeft,
  Info,
} from "lucide-react";
import { showSuccess, showError } from "../utils/toast";

const BatchDiscovery = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const response = await batchService.uploadBatch(
        selectedFile,
        batchName,
        batchDescription
      );

      if (response.success) {
        showSuccess(
          `Batch uploaded! Processing ${response.totalItems} items...`
        );
        setCurrentBatchId(response.batchId);

        setSelectedFile(null);
        setBatchName("");
        setBatchDescription("");
      } else {
        showError(response.error || "Upload failed");
      }
    } catch (error) {
      showError(error.response?.data?.error || "Failed to upload batch");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = (type) => {
    batchService.downloadTemplate(type);
    showSuccess(`Template downloaded: ${type}`);
  };

  const handleBatchComplete = () => {
    showSuccess("Batch processing completed!");
  };

  const handleBackToUpload = () => {
    setCurrentBatchId(null);
  };

  if (currentBatchId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={handleBackToUpload}
            className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>

          <BatchProgress
            batchId={currentBatchId}
            onComplete={handleBatchComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Batch Discovery
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Process multiple compound criteria at once
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Download template</li>
              <li>Fill criteria (max 100 rows)</li>
              <li>Upload & process</li>
              <li>Track progress</li>
              <li>View results</li>
            </ol>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📥 Download Templates
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Structured Template
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Predefined fields
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadTemplate("structured")}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    AI Prompt Template
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Natural language
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadTemplate("ai-prompt")}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📤 Upload Batch File
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Batch Name (Optional)
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Industrial Surfactants Test"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={batchDescription}
                onChange={(e) => setBatchDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          <FileUploader onFileSelect={handleFileSelect} />

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Layers className="w-5 h-5" />
                Upload & Process
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/batch/history")}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View Batch History →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchDiscovery;
