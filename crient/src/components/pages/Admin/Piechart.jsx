import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import ActionLogs from "./ActionLogs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const TransactionPieChart = ({ embedLogs = true }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "http://188.137.183.73:4000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/transactions");
        const transactions = response.data;

        let totalDeposits = 0;
        let totalWithdrawals = 0;

        transactions.forEach((transaction) => {
          const amount = parseFloat(transaction.amount);
          if (transaction.transaction_type === "deposit") {
            totalDeposits += amount;
          } else if (transaction.transaction_type === "withdrawal") {
            totalWithdrawals += amount;
          }
        });

        const totalAmount = totalDeposits + totalWithdrawals;

        setChartData({
          labels: ["Deposits", "Withdrawals"],
          datasets: [
            {
              label: "Transaction Amounts",
              data: [totalDeposits, totalWithdrawals],
              backgroundColor: ["#1B4D3E", "#C4A35A"],
              hoverBackgroundColor: ["#14382E", "#B08F45"],
              borderWidth: 0,
              cutout: "58%",
            },
          ],
          totalAmount,
        });
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          color: "#6B6560",
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const total = context.chart.config.data.totalAmount || 1;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: Frw ${Number(value).toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      {loading ? (
        <p className="text-sm text-stone-mute">Loading…</p>
      ) : chartData ? (
        <div className="mx-auto flex max-w-[16rem] justify-center">
          <Pie data={chartData} options={options} />
        </div>
      ) : (
        <p className="text-sm text-stone-mute">No transaction data yet.</p>
      )}
      {embedLogs && (
        <div className="mt-6 border-t border-stone-line pt-5">
          <ActionLogs />
        </div>
      )}
    </div>
  );
};

export default TransactionPieChart;
