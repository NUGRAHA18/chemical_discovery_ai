import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { batchService } from "../services/batch";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../utils/toast";
import Loading from "../components/common/Loading";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  StopCircle,
  Download,
  Eye,
  AlertCircle,
} from "lucide-react";

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    loadBatch();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [id]);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const data = await batchService.getBatch(id);
      setBatch(data.batch);

      // Start progress streaming if processing
      if (
        data.batch.status === "pending" ||
        data.batch.status === "processing"
      ) {
        startProgressStreaming();
      }
    } catch (error) {
      console.error("Failed to load batch:", error);
      showError("Failed to load batch details");
      navigate("/batch");
    } finally {
      setLoading(false);
    }
  };

  const startProgressStreaming = () => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    eventSourceRef.current = batchService.streamProgress(
      id,
      (progressData) => {
        setProgress(progressData);

        // Update batch progress locally
        if (batch) {
          setBatch((prev) => ({
            ...prev,
            status: progressData.status,
            progress: progressData.progress,
          }));
        }
      },
      () => {
        // Completed - reload full batch
        loadBatch();
      },
      (error) => {
        console.error("Progress stream error:", error);
      }
    );
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this batch? Processing will stop.")) {
      return;
    }

    const loadingToast = showLoading("Cancelling batch...");

    try {
      await batchService.cancelBatch(id);
      dismissToast(loadingToast);
      showSuccess("Batch cancelled");

      // Close progress stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      await loadBatch();
    } catch (error) {
      dismissToast(loadingToast);
      showError("Failed to cancel batch");
    }
  };

  const getItemStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4 text-gray-400" />,
      processing: <Loader className="w-4 h-4 text-blue-500 animate-spin" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <XCircle className="w-4 h-4 text-red-500" />,
    };
    return icons[status] || icons.pending;
  };

  const exportResults = () => {
    if (!batch) return;

    // Create CSV content
    const headers = [
      "Row",
      "Criteria",
      "Status",
      "Compounds",
      "Processing Time (s)",
      "Error",
    ];

    const rows = batch.items.map((item) => [
      item.rowNumber,
      `"${item.criteria}"`,
      item.status,
      item.discoveryId ? "3" : "0",
      item.processingTime ? (item.processingTime / 1000).toFixed(2) : "",
      `"${item.error || ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch-${batch.name.replace(/\s+/g, "-")}-results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSuccess("Results exported to CSV");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Batch Not Found
          </h2>
          <button
            onClick={() => navigate("/batch")}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/batch")}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {batch.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {batch.description || "No description"}
              </p>
            </div>

            <div className="flex gap-3">
              {batch.status === "completed" && (
                <button
                  onClick={exportResults}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </button>
              )}
              {(batch.status === "processing" ||
                batch.status === "pending") && (
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Cancel Batch
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Items
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {batch.totalItems}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Completed
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {batch.progress?.completed || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Failed
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {batch.progress?.failed || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Progress
            </div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {batch.progress?.percentage || 0}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {(batch.status === "processing" || batch.status === "pending") && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Processing Status
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {batch.progress?.completed + batch.progress?.failed || 0} /{" "}
                {batch.totalItems} items processed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${batch.progress?.percentage || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Batch Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Row
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Criteria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {batch.items.map((item) => (
                  <tr
                    key={item.rowNumber}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{item.rowNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-md truncate">
                      {item.criteria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getItemStatusIcon(item.status)}
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {item.status}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {item.error}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.processingTime
                        ? `${(item.processingTime / 1000).toFixed(1)}s`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.discoveryId && (
                        <Link
                          to={`/discovery/${item.discoveryId}`}
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDetail;
