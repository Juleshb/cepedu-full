import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from "axios";
import Recenttransactions from './recenttransaction';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CombinedChart = ({ embedTable = true }) => {
  const [depositChartData, setDepositChartData] = useState(null);
  const [withdrawalChartData, setWithdrawalChartData] = useState(null);

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/transactions");
        const data = response.data;

        const groupedData = {};
        data.forEach((transaction) => {
          const date = transaction.transaction_date.split('T')[0];
          const amount = parseFloat(transaction.amount);

          if (!groupedData[date]) {
            groupedData[date] = { deposit: 0, withdrawal: 0 };
          }

          if (transaction.transaction_type === 'deposit') {
            groupedData[date].deposit += amount;
          } else if (transaction.transaction_type === 'withdrawal') {
            groupedData[date].withdrawal += amount;
          }
        });

        const labels = Object.keys(groupedData).sort();
        const deposits = labels.map((date) => groupedData[date].deposit);
        const withdrawals = labels.map((date) => groupedData[date].withdrawal);

        setDepositChartData({
          labels,
          datasets: [
            {
              label: 'Deposits',
              data: deposits,
              borderColor: '#1B4D3E',
              backgroundColor: 'rgba(27, 77, 62, 0.15)',
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#1B4D3E',
              pointHoverRadius: 6,
            },
          ],
        });

        setWithdrawalChartData({
          labels,
          datasets: [
            {
              label: 'Withdrawals',
              data: withdrawals,
              borderColor: '#C4A35A',
              backgroundColor: 'rgba(196, 163, 90, 0.18)',
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#C4A35A',
              pointHoverRadius: 6,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.3)',
        },
        ticks: {
          color: '#888',
        },
        title: {
          display: true,
          text: 'Amount (Frw)',
          color: '#555',
        },
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.3)',
        },
        ticks: {
          color: '#888',
        },
        title: {
          display: true,
          text: 'Date',
          color: '#555',
        },
      },
    },
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="border border-stone-line bg-stone-panel p-5">
          <h3 className="mb-4 text-lg font-normal tracking-tight text-stone-ink">
            Deposits over time
          </h3>
          {depositChartData ? (
            <Line data={depositChartData} options={options} />
          ) : (
            <p className="text-sm text-stone-mute">Loading deposits…</p>
          )}
        </div>

        <div className="border border-stone-line bg-stone-panel p-5">
          <h3 className="mb-4 text-lg font-normal tracking-tight text-stone-ink">
            Withdrawals over time
          </h3>
          {withdrawalChartData ? (
            <Line data={withdrawalChartData} options={options} />
          ) : (
            <p className="text-sm text-stone-mute">Loading withdrawals…</p>
          )}
        </div>
      </div>

      {embedTable && (
        <div className="w-full border border-stone-line bg-stone-panel p-5">
          <Recenttransactions />
        </div>
      )}
    </div>
  );
};

export default CombinedChart;
