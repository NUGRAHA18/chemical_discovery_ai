import { useState, useEffect } from "react";
import { discoveryService } from "../services/discovery";

export const useChartData = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        discoveryService.getHistory({ limit: 30 }),
        discoveryService.getStats(),
      ]);

      // Process data for charts
      const discoveries = historyData.discoveries || [];

      // 1. Discoveries Over Time (Last 7 days)
      const last7Days = getLast7Days();
      const discoveriesByDay = last7Days.map((date) => {
        return discoveries.filter(
          (d) => new Date(d.createdAt).toDateString() === date.toDateString()
        ).length;
      });

      const timelineData = {
        labels: last7Days.map((d) =>
          d.toLocaleDateString("en-US", { weekday: "short" })
        ),
        datasets: [
          {
            label: "Discoveries",
            data: discoveriesByDay,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      };

      // 2. Input Mode Distribution
      const structuredCount = discoveries.filter(
        (d) => d.inputMode === "structured"
      ).length;
      const aiPromptCount = discoveries.filter(
        (d) => d.inputMode === "ai-prompt"
      ).length;

      const inputModeData = {
        labels: ["Structured Form", "AI Prompt"],
        datasets: [
          {
            data: [structuredCount, aiPromptCount],
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(168, 85, 247, 0.8)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(168, 85, 247)"],
            borderWidth: 2,
          },
        ],
      };

      // 3. Confidence Score Distribution
      const confidenceRanges = {
        "High (80-100%)": 0,
        "Medium (60-80%)": 0,
        "Low (0-60%)": 0,
      };

      discoveries.forEach((d) => {
        const confidence = d.metadata?.overall_confidence || 0;
        if (confidence >= 0.8) confidenceRanges["High (80-100%)"]++;
        else if (confidence >= 0.6) confidenceRanges["Medium (60-80%)"]++;
        else confidenceRanges["Low (0-60%)"]++;
      });

      const confidenceData = {
        labels: Object.keys(confidenceRanges),
        datasets: [
          {
            label: "Discoveries",
            data: Object.values(confidenceRanges),
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
          },
        ],
      };

      // 4. Recent Activity
      const recentActivityData = {
        totalDiscoveries: statsData.totalDiscoveries || 0,
        totalCompounds: statsData.totalCompounds || 0,
        avgConfidence: statsData.avgConfidence || 0,
        thisWeek: discoveriesByDay.reduce((a, b) => a + b, 0),
      };

      setChartData({
        timeline: timelineData,
        inputMode: inputModeData,
        confidence: confidenceData,
        activity: recentActivityData,
      });
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  return { chartData, loading, refresh: loadChartData };
};
