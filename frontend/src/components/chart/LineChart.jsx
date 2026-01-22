import { Line } from "react-chartjs-2";
import { useDarkMode } from "../../contexts/DarkModeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const LineChart = ({ data }) => {
  const { isDark } = useDarkMode();

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Penting agar chart mengikuti ukuran container
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(255, 255, 255, 0.9)",
        titleColor: isDark ? "#fff" : "#000",
        bodyColor: isDark ? "#fff" : "#000",
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
        },
      },
    },
  };

  return (
    // PERBAIKAN: Gunakan h-full agar mengikuti tinggi container di Dashboard (300px)
    // dan tambahkan conditional rendering
    <div className="relative w-full h-full">
      {data && <Line data={data} options={options} />}
    </div>
  );
};

export default LineChart;
