import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "../../layout/AppShell";
import {
  DashboardWelcome,
  MetricStrip,
  Panel,
  SectionHeading,
} from "../../layout/DashboardUI";
import { adminNavItems } from "../../layout/navItems";
import CombinedChart from "./Chart";
import TransactionPieChart from "./Piechart";
import Recenttransactions from "./recenttransaction";
import ActionLogs from "./ActionLogs";

function formatMoney(value) {
  const num = Number(value || 0);
  return `Frw ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Dashboard() {
  const [stats, setStats] = useState({
    deposits: 0,
    withdrawals: 0,
    count: 0,
    members: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const api = axios.create({
      baseURL: "http://188.137.183.73:4000/api",
      headers: { Authorization: `Bearer ${token}` },
    });

    const load = async () => {
      try {
        const [txRes, usersRes] = await Promise.all([
          api.get("/transactions").catch(() => ({ data: [] })),
          api.get("/users").catch(() => ({ data: [] })),
        ]);

        const transactions = Array.isArray(txRes.data) ? txRes.data : [];
        let deposits = 0;
        let withdrawals = 0;
        transactions.forEach((t) => {
          const amount = parseFloat(t.amount) || 0;
          if (t.transaction_type === "deposit") deposits += amount;
          if (t.transaction_type === "withdrawal") withdrawals += amount;
        });

        setStats({
          deposits,
          withdrawals,
          count: transactions.length,
          members: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    };

    load();
  }, []);

  const metrics = [
    {
      label: "Total deposits",
      value: formatMoney(stats.deposits),
      icon: "solar:arrow-down-linear",
      hint: "All member deposits",
    },
    {
      label: "Total withdrawals",
      value: formatMoney(stats.withdrawals),
      icon: "solar:arrow-up-linear",
      hint: "All member withdrawals",
    },
    {
      label: "Transactions",
      value: String(stats.count),
      icon: "solar:transfer-horizontal-linear",
      hint: "Recorded movements",
    },
    {
      label: "Members",
      value: String(stats.members),
      icon: "solar:users-group-rounded-linear",
      hint: "Registered accounts",
    },
  ];

  return (
    <AppShell
      sidebarItems={adminNavItems}
      logoutTo="/logout"
      brandTo="/dashboard"
      title="Overview"
    >
      <div className="space-y-8">
        <DashboardWelcome
          eyebrow="Admin workspace"
          title="Cooperative overview"
          description="Monitor deposits, withdrawals, and member activity across CEPEDHU."
          actions={[
            {
              to: "/account",
              label: "Deposit / Withdraw",
              icon: "solar:wallet-money-linear",
            },
            {
              to: "/users",
              label: "Members",
              icon: "solar:users-group-rounded-linear",
            },
          ]}
        />

        <MetricStrip metrics={metrics} columns={4} />

        <section>
          <SectionHeading
            title="Cashflow"
            subtitle="Deposit and withdrawal trends across the cooperative."
          />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <CombinedChart embedTable={false} />
            </div>
            <Panel title="Mix" subtitle="Deposits vs withdrawals">
              <TransactionPieChart embedLogs={false} />
            </Panel>
          </div>
        </section>

        <section>
          <SectionHeading
            title="Recent activity"
            subtitle="Latest transactions and admin actions."
          />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <Panel title="Transactions" subtitle="Most recent movements">
                <Recenttransactions />
              </Panel>
            </div>
            <div className="xl:col-span-2">
              <Panel title="Admin log" subtitle="Latest actions">
                <ActionLogs />
              </Panel>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default Dashboard;
