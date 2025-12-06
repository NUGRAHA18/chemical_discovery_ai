import { useState, useEffect, useMemo } from "react";
import { discoveryService } from "../services/discovery";

export const useChartData = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const data = await discoveryService.getHistory({ limit: 100 });
        setDiscoveries(data.discoveries || []);
      } catch (error) {
        console.error("Failed to load chart data:", error);
        setError(error.message || "Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!discoveries || discoveries.length === 0) {
      return null;
    }

    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    const timelineCounts = {};
    last7Days.forEach((date) => {
      timelineCounts[date] = 0;
    });

    discoveries.forEach((discovery) => {
      const date = new Date(discovery.createdAt).toISOString().split("T")[0];
      if (timelineCounts.hasOwnProperty(date)) {
        timelineCounts[date]++;
      }
    });

    const timelineData = {
      labels: last7Days.map((date) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }),
      datasets: [
        {
          label: "Discoveries",
          data: last7Days.map((date) => timelineCounts[date]),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };

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

    const confidenceBuckets = {
      "0-20%": 0,
      "20-40%": 0,
      "40-60%": 0,
      "60-80%": 0,
      "80-100%": 0,
    };

    discoveries.forEach((discovery) => {
      const confidence = (discovery.metadata?.overall_confidence || 0) * 100;
      if (confidence < 20) confidenceBuckets["0-20%"]++;
      else if (confidence < 40) confidenceBuckets["20-40%"]++;
      else if (confidence < 60) confidenceBuckets["40-60%"]++;
      else if (confidence < 80) confidenceBuckets["60-80%"]++;
      else confidenceBuckets["80-100%"]++;
    });

    const confidenceData = {
      labels: Object.keys(confidenceBuckets),
      datasets: [
        {
          label: "Discoveries",
          data: Object.values(confidenceBuckets),
          backgroundColor: "rgba(16, 185, 129, 0.6)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
        },
      ],
    };

    const thisWeekCount = discoveries.filter((d) => {
      const createdAt = new Date(d.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt >= weekAgo;
    }).length;

    return {
      timeline: timelineData,
      inputMode: inputModeData,
      confidence: confidenceData,
      activity: {
        thisWeek: thisWeekCount,
        total: discoveries.length,
      },
    };
  }, [discoveries]);

  return { chartData, loading, error };
};
