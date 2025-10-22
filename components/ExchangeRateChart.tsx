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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DayOutput {
  date: string;
  rate: number | null;
  pct_change: number | null;
}

interface SummaryOutput {
  start_rate: number | null;
  end_rate: number | null;
  total_pct_change: number | null;
  mean_rate: number | null;
}

interface ExchangeRateChartProps {
  data: DayOutput[];
  summary: SummaryOutput;
}

export const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({ data, summary }) => {
  const validData = data.filter(d => d.rate !== null);
  
  const chartData = {
    labels: validData.map(d => d.date),
    datasets: [
      {
        label: 'EUR to USD Rate',
        data: validData.map(d => d.rate),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'EUR to USD Exchange Rate',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const dataPoint = validData[context.dataIndex];
            const pctChange = dataPoint.pct_change;
            const pctText = pctChange !== null ? ` (${pctChange > 0 ? '+' : ''}${pctChange.toFixed(2)}%)` : '';
            return `Rate: ${context.parsed.y.toFixed(4)}${pctText}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Exchange Rate',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Exchange Rate Chart</h3>
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
