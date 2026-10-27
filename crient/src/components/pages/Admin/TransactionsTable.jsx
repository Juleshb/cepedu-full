import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Logo from "../../assets/logo.png";
import { motion } from "framer-motion";
import { AdminShell } from "../../layout/AppShell";
import { Panel, SectionHeading } from "../../layout/DashboardUI";

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({
    account_id: "",
    transaction_type: "",
    amount: "",
    description: "",
  });
  const [accountId, setAccountId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axiosInstance.get("/transactions");
        setTransactions(response.data);
        setFilteredTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModal = (type, transaction = null) => {
    setModalType(type);
    setSelectedTransaction(transaction);
    setFormData({
      account_id: transaction?.account_id || "",
      transaction_type: transaction?.transaction_type || "",
      amount: transaction?.amount || "",
      description: transaction?.description || "",
    });
    setShowModal(true);
  };

  const handleAddTransaction = async () => {
    try {
      await axiosInstance.post("/transactions", formData);
      alert("Transaction added successfully.");
      setShowModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding transaction:", error.message);
    }
  };

  const handleUpdateTransaction = async () => {
    try {
      await axiosInstance.put(
        `/transactions/${selectedTransaction.transaction_id}`,
        formData
      );
      alert("Transaction updated successfully.");
      setShowModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating transaction:", error.message);
    }
  };

  const handleFilterByAccount = async () => {
    try {
      const response = await axiosInstance.get(
        `/transactions/account/${accountId}`
      );
      setFilteredTransactions(response.data);
    } catch (error) {
      console.error("Error filtering transactions:", error.message);
    }
  };

  const handleFilterByType = async () => {
    try {
      const response = await axiosInstance.get(
        `/transactions/type/${transactionType}`
      );
      setFilteredTransactions(response.data);
    } catch (error) {
      console.error("Error filtering transactions:", error.message);
    }
  };

  const handleSummary = async () => {
    try {
      const response = await axiosInstance.get(
        `/transactions/summary/${accountId}`
      );
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error.message);
    }
  };

  const resetFilters = () => {
    setAccountId("");
    setTransactionType("");
    setSummary(null);
    setFilteredTransactions(transactions);
  };

  if (loading) {
    return (
      <AdminShell title="Transactions">
        <div className="flex h-[50vh] items-center justify-center">
          <motion.img
            src={Logo}
            alt="Loading..."
            className="h-24"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Transactions">
      <SectionHeading
        title="Transaction ledger"
        subtitle="Filter and review all cooperative deposits and withdrawals."
      />

      <Panel title="Filters" className="mb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="text"
            placeholder="Account ID"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="input-field max-w-xs py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleFilterByAccount}
            className="btn-toolbar"
          >
            Filter by account
          </button>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="input-field max-w-xs py-2 text-sm"
          >
            <option value="">Select type</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <button
            type="button"
            onClick={handleFilterByType}
            className="btn-toolbar-outline"
          >
            Filter by type
          </button>
          <button
            type="button"
            onClick={handleSummary}
            className="btn-toolbar-outline"
          >
            Show summary
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-toolbar-outline"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => handleModal("add")}
            className="btn-toolbar lg:ml-auto"
          >
            <Icon icon="solar:add-circle-linear" width="16" height="16" />
            Add transaction
          </button>
        </div>

        {summary && (
          <div className="mt-4 border border-stone-line bg-white px-4 py-3 text-sm">
            <p className="font-semibold text-stone-ink">Summary</p>
            <p className="mt-1 text-stone-mute">
              Total transactions: {summary.total_transactions}
            </p>
            <p className="text-stone-mute">
              Total amount: Frw {summary.total_amount}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="All transactions">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Reference</th>
                <th>Account</th>
                <th>Member</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const isDeposit =
                  transaction.transaction_type === "deposit";
                return (
                  <tr
                    key={
                      transaction.transaction_id ||
                      transaction.transaction_number
                    }
                  >
                    <td>
                      <div className="flex items-center gap-2">
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
                        {transaction.description}
                      </div>
                    </td>
                    <td className="font-medium text-primary">
                      TX-{transaction.transaction_number}
                    </td>
                    <td className="text-stone-mute">
                      {transaction.accountnumber}
                    </td>
                    <td className="capitalize">{transaction.name}</td>
                    <td>
                      {new Date(
                        transaction.transaction_date
                      ).toLocaleDateString()}
                    </td>
                    <td
                      className={`font-medium ${
                        isDeposit ? "text-primary" : "text-stone-ink"
                      }`}
                    >
                      {isDeposit
                        ? `+ Frw ${transaction.amount}`
                        : `- Frw ${Math.abs(transaction.amount)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="w-full max-w-md border border-stone-line bg-stone-panel p-6">
            <h2 className="mb-4 text-2xl font-normal tracking-tight text-stone-ink">
              {modalType === "edit" ? "Edit transaction" : "Add transaction"}
            </h2>
            <div className="space-y-3">
              <input
                name="account_id"
                placeholder="Account ID"
                value={formData.account_id}
                onChange={handleChange}
                className="input-field"
              />
              <select
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select type</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
              <input
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
              />
              <input
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={
                  modalType === "edit"
                    ? handleUpdateTransaction
                    : handleAddTransaction
                }
                className="btn-toolbar"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-toolbar-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default TransactionsTable;
