import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const statusClass = (status) => {
  const map = {
    pending: "bg-accent-soft/70 text-stone-ink",
    approved: "bg-primary-muted text-primary-dark",
    rejected: "bg-red-50 text-red-800",
    completed: "bg-primary-muted text-primary-dark",
  };
  return map[status] || "bg-stone-line text-stone-ink";
};

const LoanApply = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [loanForm, setLoanForm] = useState({
    user_id: "",
    amount: "",
    repayment_period: "",
  });

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
    try {
      const response = await axiosInstance.get("/loans");
      setLoans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const [usersRes, accountsRes] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/accounts"),
      ]);
      const accounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];

      const accountByUser = {};
      accounts.forEach((account) => {
        if (!accountByUser[account.user_id]) {
          accountByUser[account.user_id] = account;
        }
      });

      setMembers(
        users
          .filter((user) => user.role === "user" || user.role === "admin")
          .map((user) => ({
            ...user,
            account_number:
              accountByUser[user.user_id]?.accountnumber ||
              accountByUser[user.user_id]?.account_number ||
              null,
          }))
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      );
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const applyForLoan = async () => {
    const { user_id, amount, repayment_period } = loanForm;
    if (!user_id || !amount || !repayment_period) {
      alert("Please select a member and fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post("/loans", {
        user_id: Number(user_id),
        amount: Number(amount),
        repayment_period: Number(repayment_period),
      });
      setLoanForm({ user_id: "", amount: "", repayment_period: "" });
      setMemberQuery("");
      setIsModalOpen(false);
      fetchLoans();
    } catch (error) {
      console.error("Error applying for loan:", error);
      alert(error.response?.data?.message || "Failed to apply for loan");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchMembers();
  }, []);

  const selectedMember = members.find(
    (member) => String(member.user_id) === String(loanForm.user_id)
  );

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members.slice(0, 40);
    return members
      .filter((member) => {
        const haystack = [
          member.name,
          member.email,
          member.account_number,
          member.telephone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 40);
  }, [members, memberQuery]);

  return (
    <div>
      <div className="page-toolbar">
        <p className="text-sm text-stone-mute">
          Submit a loan application on behalf of a member.
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-toolbar"
        >
          <Icon icon="solar:add-circle-linear" width="16" height="16" />
          Apply for loan
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-mute">
          Loading applications…
        </p>
      ) : loans.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-mute">
          No loan applications yet.
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.loan_id}>
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
                      onClick={() => setSelectedLoan(loan)}
                      className="btn-table"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="relative w-full max-w-lg rounded-[1.5rem] border border-stone-line bg-stone-panel p-6">
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              className="absolute right-4 top-4 text-stone-mute hover:text-primary"
            >
              <Icon icon="mdi:close" width="22" height="22" />
            </button>
            <h2 className="text-2xl font-normal tracking-tight text-stone-ink">
              Loan #{selectedLoan.loan_id}
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Member</span>
                <span className="font-medium">
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
                <span className="text-stone-mute">Amount</span>
                <span className="font-amount">
                  Frw {formatMoney(selectedLoan.amount)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-stone-line py-2">
                <span className="text-stone-mute">Period</span>
                <span>{selectedLoan.repayment_period} months</span>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <span className="text-stone-mute">Status</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusClass(selectedLoan.status)}`}
                >
                  {selectedLoan.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              className="btn-toolbar-outline mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="w-full max-w-lg rounded-[1.5rem] border border-stone-line bg-stone-panel p-6">
            <h2 className="text-2xl font-normal tracking-tight text-stone-ink">
              Apply for a loan
            </h2>
            <p className="mt-1 text-sm text-stone-mute">
              Search by member name or account number.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-stone-ink">
                  Member
                </label>
                <input
                  type="search"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="input-field py-2.5 text-sm"
                  placeholder="Type name or account number…"
                />
                <div className="mt-2 max-h-44 overflow-y-auto rounded-[1rem] border border-stone-line bg-white">
                  {filteredMembers.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-stone-mute">
                      No members found.
                    </p>
                  ) : (
                    filteredMembers.map((member) => {
                      const active =
                        String(loanForm.user_id) === String(member.user_id);
                      return (
                        <button
                          key={member.user_id}
                          type="button"
                          onClick={() => {
                            setLoanForm((prev) => ({
                              ...prev,
                              user_id: member.user_id,
                            }));
                            setMemberQuery(member.name);
                          }}
                          className={`flex w-full items-start justify-between gap-3 border-b border-stone-line/70 px-4 py-3 text-left last:border-0 ${
                            active
                              ? "bg-primary-muted/50"
                              : "hover:bg-stone-page"
                          }`}
                        >
                          <span>
                            <span className="block text-sm font-medium text-stone-ink">
                              {member.name}
                            </span>
                            <span className="block text-xs text-stone-mute">
                              {member.email}
                            </span>
                          </span>
                          <span className="font-amount text-xs text-primary">
                            {member.account_number || "No account"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                {selectedMember && (
                  <p className="mt-2 text-xs text-stone-mute">
                    Selected:{" "}
                    <span className="text-stone-ink">{selectedMember.name}</span>
                    {selectedMember.account_number
                      ? ` · Acc ${selectedMember.account_number}`
                      : ""}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-stone-ink">
                  Loan amount (Frw)
                </label>
                <input
                  type="number"
                  min="1"
                  value={loanForm.amount}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, amount: e.target.value })
                  }
                  className="input-field py-2.5 text-sm"
                  placeholder="e.g. 200000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-stone-ink">
                  Repayment period (months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={loanForm.repayment_period}
                  onChange={(e) =>
                    setLoanForm({
                      ...loanForm,
                      repayment_period: e.target.value,
                    })
                  }
                  className="input-field py-2.5 text-sm"
                  placeholder="e.g. 6"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-toolbar-outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-toolbar"
                disabled={submitting}
                onClick={applyForLoan}
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApply;
