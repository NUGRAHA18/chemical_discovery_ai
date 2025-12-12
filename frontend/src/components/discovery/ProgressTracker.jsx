import { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Terminal,
} from "lucide-react";

const ProgressTracker = ({ progress, logs, onComplete }) => {
  const [showLogs, setShowLogs] = useState(true);
  const logsEndRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Handle completion
  useEffect(() => {
    if (progress?.step === "complete" && onComplete) {
      setTimeout(() => {
        onComplete(progress);
      }, 1500);
    }
  }, [progress, onComplete]);

  if (!progress) return null;

  const progressPercent = progress.progress || 0;
  const isComplete = progress.step === "complete";
  const isError = progress.error || progress.step === "error";

  // Agent status mapping
  const agentSteps = [
    { name: "Preprocessor", step: "preprocessing", range: [0, 15] },
    { name: "Analyzer", step: "analyzing", range: [15, 25] },
    { name: "Researcher", step: "researching", range: [25, 40] },
    { name: "Generator", step: "generating", range: [40, 70] },
    { name: "Validator", step: "validating", range: [70, 85] },
    { name: "Justifier", step: "justifying", range: [85, 95] },
  ];

  const getAgentStatus = (agent) => {
    if (isComplete) return "complete";
    if (isError) return "error";

    const currentProgress = progressPercent;
    const [min, max] = agent.range;

    if (currentProgress >= max) return "complete";
    if (currentProgress >= min && currentProgress < max) return "active";
    return "pending";
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "info":
      default:
        return <Clock className="w-3 h-3 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  isComplete
                    ? "bg-green-100 dark:bg-green-900/30"
                    : isError
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-orange-100 dark:bg-orange-900/30"
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : isError ? (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Loader2 className="w-6 h-6 text-orange-600 dark:text-orange-400 animate-spin" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isComplete
                    ? "✅ Discovery Complete!"
                    : isError
                    ? "❌ Discovery Failed"
                    : "🔬 Generating Compounds..."}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {progress.message || "Processing..."}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {progressPercent}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {progress.agent || "System"}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isComplete
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : isError
                    ? "bg-gradient-to-r from-red-500 to-rose-500"
                    : "bg-gradient-to-r from-orange-500 to-red-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Agent Status */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Agent Pipeline
            </h3>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
            >
              <Terminal className="w-3 h-3" />
              {showLogs ? "Hide" : "Show"} Logs
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agentSteps.map((agent) => {
              const status = getAgentStatus(agent);
              return (
                <div
                  key={agent.name}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === "complete"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600"
                      : status === "active"
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-600 animate-pulse"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {status === "complete" ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : status === "active" ? (
                      <Loader2 className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        status === "complete"
                          ? "text-green-700 dark:text-green-300"
                          : status === "active"
                          ? "text-orange-700 dark:text-orange-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {agent.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Logs */}
        {showLogs && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  LIVE LOGS
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({logs.length} entries)
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-900 p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No logs yet...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 mb-2 text-gray-300 hover:bg-gray-800/50 p-1 rounded group"
                  >
                    <span className="text-gray-500 shrink-0">[{log.time}]</span>
                    {getLogIcon(log.type)}
                    <span className="text-gray-400 shrink-0 min-w-[80px]">
                      [{log.agent}]
                    </span>
                    <span
                      className={`${
                        log.type === "error"
                          ? "text-red-400"
                          : log.type === "success"
                          ? "text-green-400"
                          : "text-gray-300"
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Footer - Action Buttons */}
        {isComplete && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onComplete && onComplete(progress)}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              View Results
            </button>
          </div>
        )}

        {isError && (
          <div className="p-6 bg-white dark:bg-gray-800 border-t border-red-100 dark:border-red-900/50 flex flex-col items-center text-center">
            {/* Icon Peringatan Besar */}
            <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Pesan Error */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Discovery Stopped
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {progress.message ||
                "An error occurred during the discovery process. Please check your connection and try again."}
            </p>

            {/* Tombol Action */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => window.location.reload()} // Atau ganti dengan fungsi close/reset jika ada
                className="flex-1 py-2.5 bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
