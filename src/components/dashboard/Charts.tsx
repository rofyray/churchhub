'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle } from '@/components/ui';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart.js default options for dark theme
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: {
          family: 'Poppins',
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
    },
  },
};

interface GenderChartProps {
  male: number;
  female: number;
}

export function GenderChart({ male, female }: GenderChartProps) {
  const data = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [male, female],
        backgroundColor: ['#338df2', '#f472b6'],
        borderColor: ['#1f72de', '#db2777'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          padding: 20,
          font: {
            family: 'Poppins',
          },
        },
      },
    },
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Gender Distribution</CardTitle>
      </CardHeader>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    </Card>
  );
}

interface GrowthChartProps {
  data: { month: string; count: number }[];
  selectedYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
}

export function GrowthChart({ data, selectedYear, availableYears, onYearChange }: GrowthChartProps) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Members',
        data: data.map((d) => d.count),
        borderColor: '#338df2',
        backgroundColor: 'rgba(51, 141, 242, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#338df2',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Membership Growth</CardTitle>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-500/50 cursor-pointer"
            >
              {availableYears.map((year) => (
                <option key={year} value={year} className="bg-dark-secondary">
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>
      <div className="h-64">
        <Line data={chartData} options={defaultOptions} />
      </div>
    </Card>
  );
}

interface DepartmentChartProps {
  data: { department: string; count: number }[];
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  const chartData = {
    labels: data.map((d) => d.department),
    datasets: [
      {
        label: 'Members',
        data: data.map((d) => d.count),
        backgroundColor: [
          '#338df2',
          '#5aa8f7',
          '#93c5fd',
          '#f472b6',
          '#a78bfa',
          '#34d399',
          '#fbbf24',
          '#fb923c',
          '#f87171',
          '#818cf8',
          '#22d3d8',
          '#a3e635',
          '#e879f9',
          '#60a5fa',
        ],
        borderColor: 'transparent',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    ...defaultOptions,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Members by Department</CardTitle>
      </CardHeader>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

interface ChartsProps {
  genderData: { male: number; female: number };
  growthData: { month: string; count: number }[];
  departmentData: { department: string; count: number }[];
  selectedYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
}

export default function Charts({ genderData, growthData, departmentData, selectedYear, availableYears, onYearChange }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      <GenderChart male={genderData.male} female={genderData.female} />
      <GrowthChart
        data={growthData}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={onYearChange}
      />
      <DepartmentChart data={departmentData} />
    </div>
  );
}
