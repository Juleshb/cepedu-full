import { useState } from "react";
import { Icon } from "@iconify/react";
import LoanManagement from "./loanmanagement";
import LoanApply from "./applyloan";
import LoanRepayment from "./LoanRepayment";
import { UserShell } from "../../layout/AppShell";
import { Panel, SectionHeading } from "../../layout/DashboardUI";

function LoanTabs() {
  const [activeTab, setActiveTab] = useState(1);

  const tabs = [
    { id: 1, label: "My loans", icon: "solar:document-text-linear" },
    { id: 2, label: "Apply", icon: "solar:add-circle-linear" },
    { id: 3, label: "Repayments", icon: "solar:wallet-money-linear" },
  ];

  return (
    <UserShell title="Loans">
      <SectionHeading
        title="Loan center"
        subtitle="View your loans, submit applications, and follow repayments."
      />

      <Panel>
        <div className="page-tabs -mx-5 -mt-5 mb-5 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`page-tab ${
                activeTab === tab.id ? "page-tab-active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon icon={tab.icon} width="16" height="16" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 1 && <LoanManagement />}
        {activeTab === 2 && <LoanApply />}
        {activeTab === 3 && <LoanRepayment />}
      </Panel>
    </UserShell>
  );
}

export default LoanTabs;
