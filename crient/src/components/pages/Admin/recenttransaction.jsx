import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";

const Recenttransactions = () => {
  const [transactions, setTransactions] = useState([]);

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "http://188.137.183.73:4000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axiosInstance.get("/transactions");
        setTransactions(response.data.slice(0, 8));
      } catch (error) {
        console.error("Error fetching transactions:", error.message);
      }
    };
    fetchTransactions();
  }, []);

  const downloadReceipt = async (transaction) => {
    const pdf = new jsPDF();
    const date = new Date(transaction.transaction_date).toLocaleDateString();

    pdf.setFontSize(16);
    pdf.text("Transaction Receipt", 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Transaction ID: ${transaction.transaction_id}`, 20, 40);
    pdf.text(`Account Number: ${transaction.account_id}`, 20, 50);
    pdf.text(`Transaction Date: ${date}`, 20, 60);
    pdf.text(`Transaction Type: ${transaction.transaction_type}`, 20, 70);
    pdf.text(
      `Amount: ${transaction.transaction_type === "deposit" ? "+" : "-"} Frw ${transaction.amount}`,
      20,
      80
    );
    pdf.text("Thank you for using our services!", 20, 100);
    pdf.save(`receipt_${transaction.transaction_id}.pdf`);
  };

  if (!transactions.length) {
    return (
      <p className="py-8 text-center text-sm text-stone-mute">
        No recent transactions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-line text-xs uppercase tracking-[0.12em] text-stone-mute">
            <th className="pb-3 pr-4 font-medium">Date</th>
            <th className="pb-3 pr-4 font-medium">Reference</th>
            <th className="pb-3 pr-4 font-medium">Account</th>
            <th className="pb-3 pr-4 font-medium">Member</th>
            <th className="pb-3 pr-4 font-medium">Amount</th>
            <th className="pb-3 font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const isDeposit = transaction.transaction_type === "deposit";
            return (
              <tr
                key={transaction.transaction_id || transaction.transaction_number}
                className="border-b border-stone-line/70 last:border-0"
              >
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2 text-stone-ink">
                    <Icon
                      icon={
                        isDeposit
                          ? "solar:arrow-down-linear"
                          : "solar:arrow-up-linear"
                      }
                      className={isDeposit ? "text-primary" : "text-accent"}
                      width="16"
                      height="16"
                    />
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3.5 pr-4 font-medium text-primary">
                  TX-{transaction.transaction_number}
                </td>
                <td className="py-3.5 pr-4 text-stone-mute">
                  {transaction.accountnumber}
                </td>
                <td className="py-3.5 pr-4 capitalize text-stone-ink">
                  {transaction.name}
                </td>
                <td
                  className={`py-3.5 pr-4 font-medium ${
                    isDeposit ? "text-primary" : "text-stone-ink"
                  }`}
                >
                  {isDeposit
                    ? `+ Frw ${transaction.amount}`
                    : `- Frw ${Math.abs(transaction.amount)}`}
                </td>
                <td className="py-3.5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 border border-stone-line px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary-muted/40"
                    onClick={() => downloadReceipt(transaction)}
                  >
                    <Icon icon="solar:download-minimalistic-linear" width="14" height="14" />
                    PDF
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Recenttransactions;
