import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "../../layout/AppShell";
import {
  DashboardWelcome,
  MetricStrip,
  Panel,
  SectionHeading,
} from "../../layout/DashboardUI";
import { userNavItems } from "../../layout/navItems";
import CombinedChart from "./Chart";
import Recenttransactions from "./recenttransaction";

function formatMoney(value) {
  const num = Number(value || 0);
  return `Frw ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [txCount, setTxCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const api = axios.create({
      baseURL: "http://localhost:4000/api",
      headers: { Authorization: `Bearer ${token}` },
    });

    const load = async () => {
      try {
        const [balanceRes, txRes] = await Promise.all([
          api.get("/transactions/userbalance").catch(() => ({ data: {} })),
          api.get("/transactions/user").catch(() => ({ data: [] })),
        ]);
        setBalance(balanceRes.data?.total_transactions || 0);
        setTxCount(Array.isArray(txRes.data) ? txRes.data.length : 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    load();
  }, []);

  const metrics = [
    {
      label: "Total saving",
      value: balance ? formatMoney(balance) : "—",
      icon: "solar:safe-square-linear",
      hint: "Deposit total on your accounts",
    },
    {
      label: "My loan",
      value: "Pending…",
      icon: "solar:hand-money-linear",
      hint: "Active loan balance",
    },
    {
      label: "Movements",
      value: String(txCount),
      icon: "solar:transfer-horizontal-linear",
      hint: "Your recorded transactions",
    },
  ];

  return (
    <AppShell
      sidebarItems={userNavItems}
      logoutTo="/userlogout"
      brandTo="/userdashboard"
      title="Overview"
    >
      <div className="space-y-8">
        <DashboardWelcome
          eyebrow="Member portal"
          title="Your account at a glance"
          description="Track savings, loans, and recent movements on your CEPEDHU account."
          actions={[
            {
              to: "/usertransactions",
              label: "Transactions",
              icon: "solar:transfer-horizontal-linear",
            },
            {
              to: "/userloans",
              label: "Loans",
              icon: "solar:hand-money-linear",
            },
          ]}
        />

        <MetricStrip metrics={metrics} columns={3} />

        <section>
          <SectionHeading
            title="Your activity"
            subtitle="Deposits, withdrawals, and recent account movement."
          />
          <div className="space-y-5">
            <CombinedChart embedTable={false} />
            <Panel title="Recent transactions" subtitle="Your latest movements">
              <Recenttransactions />
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default Dashboard;
