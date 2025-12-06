import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { discoveryService } from "../services/discovery";
import { useChartData } from "../utils/useChartData";
import Loading from "../components/common/Loading";
import LineChart from "../components/chart/LineChart";
import DoughnutChart from "../components/chart/DoughnutChart";
import BarChart from "../components/chart/BarChart";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Hook fetch & process data sendiri
  const { chartData, loading: chartsLoading } = useChartData();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await discoveryService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || chartsLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || "Researcher"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your chemical discovery dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Discoveries
              </h3>
              <span className="text-2xl">🧪</span>
            </div>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {stats?.totalDiscoveries || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              All time
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Compounds
              </h3>
              <span className="text-2xl">⚗️</span>
            </div>
            <p className="text-4xl font-bold text-secondary-600 dark:text-secondary-400">
              {stats?.totalCompounds || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Generated
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Confidence
              </h3>
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-4xl font-bold text-accent-600 dark:text-accent-400">
              {stats?.avgConfidence
                ? (stats.avgConfidence * 100).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Validation score
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Week
              </h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {chartData?.activity?.thisWeek || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Recent activity
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Discoveries Over Time */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Discoveries Over Time (Last 7 Days)
            </h2>
            {chartData?.timeline ? (
              <LineChart data={chartData.timeline} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
                No data available
              </div>
            )}
          </div>

          {/* Input Mode Distribution */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Input Mode Distribution
            </h2>
            {chartData?.inputMode ? (
              <DoughnutChart data={chartData.inputMode} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Confidence Score Distribution */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confidence Score Distribution
            </h2>
            {chartData?.confidence ? (
              <BarChart data={chartData.confidence} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
                No data available
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Average per Discovery
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.totalDiscoveries > 0
                    ? (stats.totalCompounds / stats.totalDiscoveries).toFixed(1)
                    : "0"}{" "}
                  compounds
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Success Rate
                </span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats?.avgConfidence
                    ? (stats.avgConfidence * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Most Used Input
                </span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {chartData?.inputMode?.datasets?.[0]?.data?.[0] >
                  chartData?.inputMode?.datasets?.[0]?.data?.[1]
                    ? "Structured"
                    : "AI Prompt"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/discover"
              className="p-4 border-2 border-primary-200 dark:border-primary-800 rounded-lg hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-center"
            >
              <div className="text-3xl mb-2">🔬</div>
              <h3 className="font-semibold text-primary-700 dark:text-primary-400 mb-1">
                Start Discovery
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate new compounds
              </p>
            </Link>
            <Link
              to="/history"
              className="p-4 border-2 border-secondary-200 dark:border-secondary-800 rounded-lg hover:border-secondary-400 dark:hover:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-all text-center"
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-secondary-700 dark:text-secondary-400 mb-1">
                View History
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse discoveries
              </p>
            </Link>
            <Link
              to="/favorites"
              className="p-4 border-2 border-accent-200 dark:border-accent-800 rounded-lg hover:border-accent-400 dark:hover:border-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all text-center"
            >
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-semibold text-accent-700 dark:text-accent-400 mb-1">
                Favorites
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Saved compounds
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
