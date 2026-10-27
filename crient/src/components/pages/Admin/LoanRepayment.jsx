import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const statusClass = (status) => {
  const map = {
    pending: "bg-accent-soft/70 text-stone-ink",
    approved: "bg-primary-muted text-primary-dark",
    rejected: "bg-red-50 text-red-800",
    completed: "bg-primary-muted text-primary-dark",
    paid: "bg-primary-muted text-primary-dark",
  };
  return map[status] || "bg-stone-line text-stone-ink";
};

const LoanRepayment = () => {
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repaymentsLoading, setRepaymentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentDueDate, setRepaymentDueDate] = useState("");

  const token = localStorage.getItem("token");
  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: "http://188.137.183.73:4000/api",
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token]
  );

  const fetchLoans = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/loans");
      setLoans(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching loans:", err.message);
      setError("Failed to fetch loans. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepayments = async (loanId) => {
    setRepaymentsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/loan-repayments/loan/${loanId}`
      );
      setRepayments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching repayments:", err.message);
      setError("Failed to fetch repayments. Please try again later.");
    } finally {
      setRepaymentsLoading(false);
    }
  };

  const addRepayment = async (e) => {
    e.preventDefault();
    if (!repaymentAmount || !repaymentDueDate) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await axiosInstance.post("/loan-repayments", {
        loan_id: selectedLoan.loan_id,
        amount: repaymentAmount,
        due_date: repaymentDueDate,
      });
      setRepaymentAmount("");
      setRepaymentDueDate("");
      fetchRepayments(selectedLoan.loan_id);
    } catch (err) {
      console.error("Error adding repayment:", err.message);
      alert(err.response?.data?.message || "Failed to add repayment.");
    }
  };

  const markRepaymentAsPaid = async (repaymentId) => {
    try {
      await axiosInstance.put(`/loan-repayments/${repaymentId}/paid`);
      fetchRepayments(selectedLoan.loan_id);
    } catch (err) {
      console.error("Error marking repayment as paid:", err.message);
      alert(err.response?.data?.message || "Failed to mark repayment as paid.");
    }
  };

  const deleteRepayment = async (repaymentId) => {
    if (!window.confirm("Delete this repayment schedule item?")) return;
    try {
      await axiosInstance.delete(`/loan-repayments/${repaymentId}`);
      fetchRepayments(selectedLoan.loan_id);
    } catch (err) {
      console.error("Error deleting repayment:", err.message);
      alert(err.response?.data?.message || "Failed to delete repayment.");
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return loans;
    return loans.filter((loan) => {
      const haystack = [
        loan.user_name,
        loan.account_number,
        loan.user_email,
        loan.loan_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [loans, search]);

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-stone-mute">Loading loans…</p>
    );
  }

  if (error && loans.length === 0) {
    return <p className="alert-error">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="page-toolbar">
          <p className="text-sm text-stone-mute">
            Select a loan to manage its repayment schedule.
          </p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or account…"
            className="input-field w-full max-w-xs py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan</th>
                <th>Member</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr
                    key={loan.loan_id}
                    className={
                      selectedLoan?.loan_id === loan.loan_id
                        ? "bg-primary-muted/30"
                        : undefined
                    }
                  >
                    <td className="font-medium">#{loan.loan_id}</td>
                    <td>
                      <p className="font-medium">
                        {loan.user_name || "Unknown member"}
                      </p>
                      <p className="text-xs text-stone-mute">
                        {loan.user_email || "—"}
                      </p>
                    </td>
                    <td className="font-amount">
                      {loan.account_number || "—"}
                    </td>
                    <td className="font-amount">
                      Frw {formatMoney(loan.amount)}
                    </td>
                    <td>{loan.repayment_period} mo</td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusClass(loan.status)}`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLoan(loan);
                          fetchRepayments(loan.loan_id);
                        }}
                        className="btn-table"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-8 text-center text-stone-mute"
                  >
                    No loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLoan && (
        <div className="rounded-[1.25rem] border border-stone-line bg-white/60 p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-stone-mute">
                Repayments
              </p>
              <h3 className="mt-1 text-xl font-normal tracking-tight text-stone-ink">
                {selectedLoan.user_name || "Member"} · Loan #
                {selectedLoan.loan_id}
              </h3>
              <p className="mt-1 text-sm text-stone-mute">
                Account {selectedLoan.account_number || "—"} · Frw{" "}
                {formatMoney(selectedLoan.amount)}
              </p>
            </div>
            <button
              type="button"
              className="btn-toolbar-outline"
              onClick={() => {
                setSelectedLoan(null);
                setRepayments([]);
              }}
            >
              Clear selection
            </button>
          </div>

          {repaymentsLoading ? (
            <p className="py-6 text-center text-sm text-stone-mute">
              Loading repayments…
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {repayments.length > 0 ? (
                    repayments.map((repayment) => (
                      <tr key={repayment.repayment_id}>
                        <td>#{repayment.repayment_id}</td>
                        <td className="font-amount">
                          Frw {formatMoney(repayment.amount)}
                        </td>
                        <td>{formatDate(repayment.due_date)}</td>
                        <td>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusClass(repayment.status)}`}
                          >
                            {repayment.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                markRepaymentAsPaid(repayment.repayment_id)
                              }
                              className="btn-table border-primary text-primary"
                              disabled={repayment.status === "paid"}
                            >
                              Mark paid
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRepayment(repayment);
                                setIsModalOpen(true);
                              }}
                              className="btn-table"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteRepayment(repayment.repayment_id)
                              }
                              className="btn-table text-red-700 hover:border-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-stone-mute"
                      >
                        No repayments scheduled for this loan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <form
            onSubmit={addRepayment}
            className="mt-6 grid gap-4 border-t border-stone-line pt-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm text-stone-ink">
                Amount (Frw)
              </label>
              <input
                type="number"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                className="input-field py-2.5 text-sm"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-stone-ink">
                Due date
              </label>
              <input
                type="date"
                value={repaymentDueDate}
                onChange={(e) => setRepaymentDueDate(e.target.value)}
                className="input-field py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-toolbar">
                <Icon icon="solar:add-circle-linear" width="16" height="16" />
                Add repayment
              </button>
            </div>
          </form>
        </div>
      )}

      {isModalOpen && selectedRepayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-stone-line bg-stone-panel p-6">
            <h4 className="text-xl font-normal tracking-tight text-stone-ink">
              Repayment #{selectedRepayment.repayment_id}
            </h4>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-stone-line py-2">
                <span className="text-stone-mute">Amount</span>
                <span className="font-amount">
                  Frw {formatMoney(selectedRepayment.amount)}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-line py-2">
                <span className="text-stone-mute">Due date</span>
                <span>{formatDate(selectedRepayment.due_date)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-stone-mute">Status</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusClass(selectedRepayment.status)}`}
                >
                  {selectedRepayment.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRepayment(null);
                setIsModalOpen(false);
              }}
              className="btn-toolbar-outline mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanRepayment;
