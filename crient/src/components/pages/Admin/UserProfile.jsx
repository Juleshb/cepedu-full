import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Logo from "../../assets/logo.png";
import { AdminShell } from "../../layout/AppShell";
import { MetricStrip, Panel } from "../../layout/DashboardUI";

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

const formatPhone = (phone) => {
  if (!phone) return "—";
  const raw = String(phone);
  return raw.startsWith("0") ? raw : `0${raw}`;
};

const statusClass = (status) => {
  const map = {
    approved: "bg-primary-muted text-primary-dark",
    completed: "bg-primary-muted text-primary-dark",
    paid: "bg-primary-muted text-primary-dark",
    pending: "bg-accent-soft/60 text-stone-ink",
    rejected: "bg-red-50 text-red-800",
    deposit: "bg-primary-muted text-primary-dark",
    withdrawal: "bg-red-50 text-red-800",
    admin: "bg-primary text-white",
    user: "bg-stone-line text-stone-ink",
  };
  return map[status] || "bg-stone-line text-stone-ink";
};

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-stone-line/70 py-3 last:border-0">
      <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-stone-mute">
        {label}
      </p>
      <p className="mt-1 text-sm text-stone-ink">{value || "—"}</p>
    </div>
  );
}

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: "http://188.137.183.73:4000/api",
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token]
  );

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get(`/users/${id}`);
        if (active) setProfile(response.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Failed to load member profile. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      active = false;
    };
  }, [axiosInstance, id]);

  if (loading) {
    return (
      <AdminShell title="Member profile">
        <div className="flex h-[50vh] items-center justify-center">
          <motion.img
            src={Logo}
            alt="Loading"
            className="h-24"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </AdminShell>
    );
  }

  if (error || !profile) {
    return (
      <AdminShell title="Member profile">
        <div className="rounded-[1.25rem] border border-stone-line bg-stone-panel p-8 text-center">
          <p className="text-stone-mute">{error || "Member not found."}</p>
          <Link to="/users" className="btn-toolbar mt-6 inline-flex">
            <Icon icon="solar:arrow-left-linear" width="16" height="16" />
            Back to members
          </Link>
        </div>
      </AdminShell>
    );
  }

  const summary = profile.summary || {};
  const accounts = profile.accounts || [];
  const loans = profile.loans || [];
  const transactions = profile.recent_transactions || [];
  const initials = (profile.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const metrics = [
    {
      label: "Balance",
      value: formatMoney(summary.total_balance),
      hint: `${summary.accounts_count || 0} account(s)`,
      icon: "solar:wallet-money-linear",
    },
    {
      label: "Shares",
      value: formatMoney(summary.total_shares),
      hint: "Member equity",
      icon: "solar:pie-chart-2-linear",
    },
    {
      label: "Monthly saving",
      value: formatMoney(summary.monthly_saving),
      hint: "Contribution plan",
      icon: "solar:calendar-mark-linear",
    },
    {
      label: "Loan exposure",
      value: formatMoney(summary.loan_exposure),
      hint: `${summary.active_loans || 0} active`,
      icon: "solar:hand-money-linear",
    },
  ];

  return (
    <AdminShell title="Member profile">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-2 text-sm font-normal text-stone-mute transition hover:text-primary"
        >
          <Icon icon="solar:arrow-left-linear" width="16" height="16" />
          Members
        </button>
      </div>

      <motion.section
        className="relative overflow-hidden rounded-[1.5rem] border border-stone-line bg-primary text-white"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 15% 20%, rgba(196,163,90,0.35), transparent 45%), radial-gradient(ellipse at 90% 80%, rgba(255,255,255,0.08), transparent 40%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 px-6 py-7 md:flex-row md:items-end md:justify-between md:px-8 md:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-normal tracking-tight">
              {initials}
            </div>
            <div>
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-accent-soft">
                CEPEDHU member
              </p>
              <h2 className="display-lg mt-2">{profile.name}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs capitalize ${statusClass(profile.role)}`}
                >
                  {profile.role}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
                  NID {profile.identification_number || "—"}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
                  Joined {formatDate(profile.created_at)}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm text-white/75 md:text-base">
                {profile.email}
                {profile.telephone ? ` · ${formatPhone(profile.telephone)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/account"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-normal text-white transition hover:bg-white/15"
            >
              <Icon icon="solar:wallet-linear" width="16" height="16" />
              Accounts
            </Link>
            <Link
              to="/loans"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-normal text-white transition hover:bg-white/15"
            >
              <Icon icon="solar:hand-money-linear" width="16" height="16" />
              Loans
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="mt-6">
        <MetricStrip metrics={metrics} columns={4} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Personal details">
            <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-6">
              <InfoRow label="Full name" value={profile.name} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={formatPhone(profile.telephone)} />
              <InfoRow
                label="Identification"
                value={profile.identification_number}
              />
              <InfoRow
                label="Date of birth"
                value={formatDate(profile.date_of_birth)}
              />
              <InfoRow label="Place of birth" value={profile.place_of_birth} />
              <InfoRow label="Residence" value={profile.residence_place} />
              <InfoRow label="Address" value={profile.address} />
            </div>
          </Panel>

          <Panel title="Work & family">
            <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-6">
              <InfoRow label="Position" value={profile.position} />
              <InfoRow label="Workplace" value={profile.place_of_working} />
              <InfoRow
                label="Marital status"
                value={
                  profile.marital_status
                    ? String(profile.marital_status).replace(/^\w/, (c) =>
                        c.toUpperCase()
                      )
                    : "—"
                }
              />
              <InfoRow label="Spouse name" value={profile.spouse_name} />
              <InfoRow label="Spouse NID" value={profile.spouse_id_number} />
              <InfoRow
                label="Spouse phone"
                value={formatPhone(profile.spouse_telephone)}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <Panel
            title="Accounts"
            subtitle={`${accounts.length} linked account(s)`}
          >
            {accounts.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-mute">
                No accounts linked to this member.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Balance</th>
                      <th>Opened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.account_id}>
                        <td className="font-medium">
                          {account.accountnumber}
                        </td>
                        <td className="font-amount">
                          {formatMoney(account.balance)}
                        </td>
                        <td>{formatDate(account.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Loans" subtitle={`${loans.length} total`}>
            {loans.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-mute">
                No loan records for this member.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Amount</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th>Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => (
                      <tr key={loan.loan_id}>
                        <td>#{loan.loan_id}</td>
                        <td className="font-amount">
                          {formatMoney(loan.amount)}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="Recent transactions"
            subtitle="Latest movements across member accounts"
          >
            {transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-mute">
                No recent transactions.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.transaction_id}>
                        <td>{formatDate(tx.transaction_date)}</td>
                        <td>{tx.accountnumber}</td>
                        <td>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusClass(tx.transaction_type)}`}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="font-amount">
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="max-w-[12rem] truncate text-stone-mute">
                          {tx.description || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}

export default UserProfile;
