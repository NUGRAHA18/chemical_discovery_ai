import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { batchService } from "../services/batch";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../utils/toast";
import Loading from "../components/common/Loading";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
} from "lucide-react";

const BatchDiscovery = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await batchService.getBatches();
      setBatches(data.batches || []);
    } catch (error) {
      console.error("Failed to load batches:", error);
      showError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileType)) {
      showError("Invalid file type. Only CSV and Excel files are supported.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError("File size exceeds 5MB limit");
      return;
    }

    const loadingToast = showLoading("Uploading batch file...");
    setUploading(true);

    try {
      const result = await batchService.uploadBatch(file);

      dismissToast(loadingToast);
      showSuccess(`Batch created! Processing ${result.totalItems} items...`);

      // Reload batches
      await loadBatches();

      // Navigate to batch detail
      navigate(`/batch/${result.batchId}`);
    } catch (error) {
      dismissToast(loadingToast);
      showError(error.response?.data?.error || "Failed to upload batch");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this batch? All associated discoveries will be removed."
      )
    ) {
      return;
    }

    const loadingToast = showLoading("Deleting batch...");

    try {
      await batchService.deleteBatch(id);
      dismissToast(loadingToast);
      showSuccess("Batch deleted successfully");
      await loadBatches();
    } catch (error) {
      dismissToast(loadingToast);
      showError("Failed to delete batch");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      ),
      processing: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Loader className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </span>
      ),
      completed: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      ),
      failed: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  const downloadTemplate = (type) => {
    batchService.downloadTemplate(type);
    showSuccess(`Template downloaded: ${type}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Batch Discovery
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Process multiple compound criteria at once by uploading CSV or Excel
            files
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Batch File
          </h2>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                : "border-gray-300 dark:border-gray-600 hover:border-primary-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              disabled={uploading}
            />

            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />

            <label
              htmlFor="file-upload"
              className="cursor-pointer text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700"
            >
              Click to browse
            </label>
            <span className="text-gray-500 dark:text-gray-400">
              {" "}
              or drag and drop
            </span>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported: CSV, XLSX, XLS | Max size: 5MB | Max rows: 100
            </p>

            {uploading && (
              <div className="mt-4">
                <Loader className="w-6 h-6 animate-spin mx-auto text-primary-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Uploading...
                </p>
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              📥 Download Templates:
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => downloadTemplate("structured")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Structured Template
              </button>
              <button
                onClick={() => downloadTemplate("ai-prompt")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Download className="w-4 h-4 mr-2" />
                AI Prompt Template
              </button>
            </div>
          </div>
        </div>

        {/* Batches List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Batches
          </h2>

          {batches.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No batches yet. Upload a file to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <div
                  key={batch._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {batch.name}
                        </h3>
                        {getStatusBadge(batch.status)}
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {batch.description || "No description"}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span>📄 {batch.filename}</span>
                        <span>📊 {batch.totalItems} items</span>
                        <span>
                          ✅ {batch.progress?.completed || 0} completed
                        </span>
                        {batch.progress?.failed > 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            ❌ {batch.progress.failed} failed
                          </span>
                        )}
                        <span>
                          {new Date(batch.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {batch.status === "processing" && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{batch.progress?.percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${batch.progress?.percentage || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/batch/${batch._id}`)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(batch._id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDiscovery;
