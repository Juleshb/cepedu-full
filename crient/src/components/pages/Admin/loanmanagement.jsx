import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  };
  return map[status] || "bg-stone-line text-stone-ink";
};

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

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
      console.error("Error fetching loans:", err);
      setError("Failed to load loans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const approveLoan = async (loanId) => {
    setActionLoading(loanId);
    try {
      await axiosInstance.put(`/loans/${loanId}/approve`);
      await fetchLoans();
      setSelectedLoan(null);
    } catch (err) {
      console.error("Error approving loan:", err);
      alert(err.response?.data?.message || "Failed to approve loan");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectLoan = async (loanId) => {
    setActionLoading(loanId);
    try {
      await axiosInstance.put(`/loans/${loanId}/reject`);
      await fetchLoans();
      setSelectedLoan(null);
    } catch (err) {
      console.error("Error rejecting loan:", err);
      alert(err.response?.data?.message || "Failed to reject loan");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteLoan = async (loanId) => {
    setActionLoading(loanId);
    try {
      await axiosInstance.delete(`/loans/${loanId}`);
      setIsDeleteConfirmOpen(false);
      setSelectedLoan(null);
      await fetchLoans();
    } catch (err) {
      console.error("Error deleting loan:", err);
      alert(err.response?.data?.message || "Failed to delete loan");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((loan) => {
      const matchesStatus =
        statusFilter === "all" || loan.status === statusFilter;
      const haystack = [
        loan.user_name,
        loan.user_email,
        loan.account_number,
        ...(loan.account_numbers || []),
        loan.loan_id,
        loan.amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [loans, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: loans.length,
      pending: loans.filter((l) => l.status === "pending").length,
      approved: loans.filter((l) => l.status === "approved").length,
      rejected: loans.filter((l) => l.status === "rejected").length,
    }),
    [loans]
  );

  return (
    <div>
      <div className="page-toolbar">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                statusFilter === item.key
                  ? "bg-primary text-white"
                  : "border border-stone-line bg-white text-stone-mute hover:border-primary hover:text-primary"
              }`}
            >
              {item.label}
              <span className="ml-1.5 opacity-70">{counts[item.key]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or account…"
          className="input-field w-full max-w-xs py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-mute">
          Loading loans…
        </p>
      ) : error ? (
        <p className="alert-error">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-mute">
          No loans match your filters.
        </p>
      ) : (
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
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => (
                <tr key={loan.loan_id}>
                  <td className="font-medium">#{loan.loan_id}</td>
                  <td>
                    <div>
                      <p className="font-medium text-stone-ink">
                        {loan.user_name || "Unknown member"}
                      </p>
                      <p className="text-xs text-stone-mute">
                        {loan.user_email || "—"}
                      </p>
                    </div>
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
                  <td>{formatDate(loan.created_at)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {loan.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === loan.loan_id}
                            onClick={() => approveLoan(loan.loan_id)}
                            className="btn-table border-primary bg-primary text-white hover:bg-primary-dark"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === loan.loan_id}
                            onClick={() => rejectLoan(loan.loan_id)}
                            className="btn-table text-red-700 hover:border-red-700"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDeleteConfirmOpen(false);
                          setSelectedLoan(loan);
                        }}
                        className="btn-table"
                        title="View"
                      >
                        <Icon icon="solar:eye-linear" width="16" height="16" />
                      </button>
                      {loan.user_id && (
                        <Link
                          to={`/users/${loan.user_id}`}
                          className="btn-table"
                          title="Member profile"
                        >
                          <Icon
                            icon="solar:user-rounded-linear"
                            width="16"
                            height="16"
                          />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLoan(loan);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="btn-table text-red-700 hover:border-red-700"
                        title="Delete"
                      >
                        <Icon
                          icon="solar:trash-bin-minimalistic-linear"
                          width="16"
                          height="16"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLoan && !isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-stone-line bg-stone-panel p-6">
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              className="absolute right-4 top-4 text-stone-mute hover:text-primary"
            >
              <Icon icon="mdi:close" width="22" height="22" />
            </button>
            <p className="text-xs font-normal uppercase tracking-[0.18em] text-stone-mute">
              Loan details
            </p>
            <h2 className="mt-2 text-2xl font-normal tracking-tight text-stone-ink">
              #{selectedLoan.loan_id}
            </h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Member</span>
                <span className="text-right font-medium">
                  {selectedLoan.user_name || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Account</span>
                <span className="font-amount">
                  {selectedLoan.account_number || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Email</span>
                <span className="text-right">{selectedLoan.user_email || "—"}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Amount</span>
                <span className="font-amount">
                  Frw {formatMoney(selectedLoan.amount)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Period</span>
                <span>{selectedLoan.repayment_period} months</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Status</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusClass(selectedLoan.status)}`}
                >
                  {selectedLoan.status}
                </span>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <span className="text-stone-mute">Applied</span>
                <span>{formatDate(selectedLoan.created_at)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedLoan.status === "pending" && (
                <>
                  <button
                    type="button"
                    className="btn-toolbar"
                    onClick={() => approveLoan(selectedLoan.loan_id)}
                  >
                    Approve loan
                  </button>
                  <button
                    type="button"
                    className="btn-toolbar-outline text-red-700"
                    onClick={() => rejectLoan(selectedLoan.loan_id)}
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedLoan.user_id && (
                <Link
                  to={`/users/${selectedLoan.user_id}`}
                  className="btn-toolbar-outline"
                >
                  View profile
                </Link>
              )}
              <button
                type="button"
                className="btn-toolbar-outline"
                onClick={() => setSelectedLoan(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-stone-line bg-stone-panel p-6">
            <h2 className="text-xl font-normal tracking-tight text-stone-ink">
              Delete loan?
            </h2>
            <p className="mt-2 text-sm text-stone-mute">
              Remove loan #{selectedLoan.loan_id} for{" "}
              <span className="text-stone-ink">
                {selectedLoan.user_name || "this member"}
              </span>
              . This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-toolbar-outline"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setSelectedLoan(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-toolbar bg-red-700 border-red-700 hover:bg-red-800"
                onClick={() => deleteLoan(selectedLoan.loan_id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
