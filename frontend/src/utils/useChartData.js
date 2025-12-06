import { useState, useEffect, useMemo } from "react";
import { discoveryService } from "../services/discovery";

export const useChartData = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await discoveryService.getHistory({ limit: 100 });
        setDiscoveries(data.discoveries || []);
      } catch (error) {
        console.error("Failed to load chart data:", error);
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

    // ============================================
    // 1. TIMELINE DATA (Last 7 Days)
    // ============================================
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

    // ============================================
    // 2. INPUT MODE DISTRIBUTION
    // ============================================
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

    // ============================================
    // 3. CONFIDENCE SCORE DISTRIBUTION
    // ============================================
    let highConfidence = 0;
    let mediumConfidence = 0;
    let lowConfidence = 0;

    discoveries.forEach((discovery) => {
      if (discovery.metadata?.overall_confidence >= 0.8) {
        highConfidence++;
      } else if (discovery.metadata?.overall_confidence >= 0.6) {
        mediumConfidence++;
      } else {
        lowConfidence++;
      }
    });

    const confidenceData = {
      labels: ["High (≥80%)", "Medium (60-79%)", "Low (<60%)"],
      datasets: [
        {
          label: "Discoveries",
          data: [highConfidence, mediumConfidence, lowConfidence],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgb(16, 185, 129)",
            "rgb(251, 191, 36)",
            "rgb(239, 68, 68)",
          ],
          borderWidth: 2,
        },
      ],
    };

    // ============================================
    // 4. ACTIVITY STATS
    // ============================================
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 7);

    const thisWeekCount = discoveries.filter(
      (d) => new Date(d.createdAt) >= thisWeekStart
    ).length;

    // ============================================
    // RETURN ALL PROCESSED DATA
    // ============================================
    return {
      timeline: timelineData,
      inputMode: inputModeData,
      confidence: confidenceData,
      activity: {
        thisWeek: thisWeekCount,
      },
    };
  }, [discoveries]);

  return { chartData, loading };
};

export default useChartData;
