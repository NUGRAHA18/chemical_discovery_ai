import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { discoveryService } from "../services/discovery";
import { useChartData } from "../utils/useChartData";
import Loading from "../components/common/Loading";
import LineChart from "../components/chart/LineChart";
import DoughnutChart from "../components/chart/DoughnutChart";
import BarChart from "../components/chart/BarChart";
import {
  FlaskConical,
  Atom,
  Activity,
  TrendingUp,
  History,
  Star,
  Plus,
  ArrowRight,
  Zap,
  CheckCircle2,
  MousePointerClick,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    chartData,
    loading: chartsLoading,
    error: chartsError,
  } = useChartData();

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back,{" "}
              <span className="text-primary-600 dark:text-primary-400">
                {user?.name || "Researcher"}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Overview of your chemical research and discovery metrics.
            </p>
          </div>
          <Link
            to="/discover"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Discovery
          </Link>
        </div>

        {/* ERROR ALERT */}
        {chartsError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center">
            <div className="mr-3">⚠️</div>
            <span>Failed to load chart data: {chartsError}</span>
          </div>
        )}

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat 1: Discoveries */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Discoveries
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats?.totalDiscoveries || 0}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <FlaskConical className="w-6 h-6" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Stat 2: Compounds */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Compounds
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats?.totalCompounds || 0}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Atom className="w-6 h-6" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Stat 3: Avg Confidence */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden hover:border-emerald-200 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg. Confidence
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.avgConfidence
                      ? (stats.avgConfidence * 100).toFixed(0)
                      : 0}
                    %
                  </h3>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${(stats?.avgConfidence || 0) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Stat 4: Weekly Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-200 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  This Week
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {chartData?.activity?.thisWeek || 0}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span>
              Active sessions
            </p>
          </div>
        </div>

        {/* CHARTS SECTION 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Timeline Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Discovery Timeline
              </h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Last 7 Days
              </span>
            </div>

            <div className="h-[300px] w-full">
              {chartData?.timeline ? (
                <LineChart data={chartData.timeline} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Activity className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">No data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Chart: Input Mode */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Input Methods
            </h2>
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              {chartData?.inputMode ? (
                <div className="w-full max-w-[200px]">
                  <DoughnutChart data={chartData.inputMode} />
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No data</p>
              )}
            </div>
          </div>
        </div>

        {/* CHARTS SECTION 2 & QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Confidence Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Confidence Score Distribution
            </h2>
            <div className="h-[250px] w-full">
              {chartData?.confidence ? (
                <BarChart data={chartData.confidence} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Detailed Stats List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Key Performance Indicators
            </h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400 mr-4">
                  <Atom className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Avg. Compounds per Discovery
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats?.totalDiscoveries > 0
                      ? (stats.totalCompounds / stats.totalDiscoveries).toFixed(
                          1
                        )
                      : "0"}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-md text-green-600 dark:text-green-400 mr-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Global Success Rate
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats?.avgConfidence
                      ? (stats.avgConfidence * 100).toFixed(0)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-md text-purple-600 dark:text-purple-400 mr-4">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Top Input Method
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {chartData?.inputMode?.datasets?.[0]?.data?.[0] >
                    chartData?.inputMode?.datasets?.[0]?.data?.[1]
                      ? "Structured Data"
                      : chartData?.inputMode?.datasets?.[0]?.data?.[1] > 0
                      ? "AI Prompting"
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS FOOTER */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Primary Action Card */}
            <Link
              to="/discover"
              className="group relative overflow-hidden p-6 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <FlaskConical className="w-8 h-8 opacity-90" />
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
                <h3 className="text-lg font-bold mb-1">Start New Discovery</h3>
                <p className="text-primary-100 text-sm">
                  Generate new compounds using AI models.
                </p>
              </div>
              {/* Decorative Background */}
              <Atom className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
            </Link>

            <Link
              to="/history"
              className="group p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-secondary-500 dark:hover:border-secondary-500 transition-all hover:-translate-y-1"
            >
              <History className="w-8 h-8 mb-4 text-gray-400 group-hover:text-secondary-500 transition-colors" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                History
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Review past experiments.
              </p>
            </Link>

            <Link
              to="/favorites"
              className="group p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-yellow-500 dark:hover:border-yellow-500 transition-all hover:-translate-y-1"
            >
              <Star className="w-8 h-8 mb-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Favorites
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Access saved compounds.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
