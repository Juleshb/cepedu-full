import { UserShell } from "../../layout/AppShell";
import { Panel, SectionHeading } from "../../layout/DashboardUI";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";

function Account() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    user_id: "",
    balance: "",
    amount: "",
    description: "",
  });

  const token = localStorage.getItem("token"); 
  const axiosInstance = axios.create({
    baseURL: "http://188.137.183.73:4000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axiosInstance.get("/accounts");
        setAccounts(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch accounts.");
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModal = (type, account = null) => {
    setModalType(type);
    setSelectedAccount(account);
    setFormData({
      user_id: account?.user_id || "",
      balance: account?.balance || "",
      amount: "",
      description: "",
    });
    setShowModal(true);
  };

  const handleCreate = async () => {
    try {
      const response = await axiosInstance.post("/accounts", {
        user_id: formData.user_id,
        balance: formData.balance,
      });
      setAccounts([...accounts, { ...formData, account_id: response.data.accountId }]);
      setShowModal(false);
      alert("Account created successfully.");
    } catch (error) {
      alert("Failed to create account.");
    }
  };

  const handleUpdate = async () => {
    try {
      await axiosInstance.put(`/accounts/${selectedAccount.account_id}`, {
        balance: formData.balance,
      });
      setAccounts(
        accounts.map((account) =>
          account.account_id === selectedAccount.account_id
            ? { ...account, balance: formData.balance }
            : account
        )
      );
      setShowModal(false);
      alert("Account updated successfully.");
    } catch (error) {
      alert("Failed to update account.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        await axiosInstance.delete(`/accounts/${id}`);
        setAccounts(accounts.filter((account) => account.account_id !== id));
        alert("Account deleted successfully.");
      } catch (error) {
        alert("Failed to delete account.");
      }
    }
  };

  const handleDeposit = async () => {
    try {
      await axiosInstance.post(`/accounts/${selectedAccount.account_id}/deposit`, {
        amount: formData.amount,
        description: formData.description,
      });
      setShowModal(false);
      alert("Deposit successful.");
    } catch (error) {
      alert("Failed to deposit.");
    }
  };

  const handleWithdraw = async () => {
    try {
      await axiosInstance.post(`/accounts/${selectedAccount.account_id}/withdraw`, {
        amount: formData.amount,
        description: formData.description,
      });
      setShowModal(false);
      alert("Withdrawal successful.");
    } catch (error) {
      alert("Failed to withdraw.");
    }
  };

  if (loading) {
    return (
      <UserShell title="Accounts">
        <p className="py-16 text-center text-stone-mute">Loading…</p>
      </UserShell>
    );
  }
  if (error) {
    return (
      <UserShell title="Accounts">
        <p className="alert-error">{error}</p>
      </UserShell>
    );
  }
  return (
    <UserShell title="Accounts">
      <SectionHeading title="My accounts" subtitle="View balances and account actions." />
      <Panel
        title="Accounts"
        action={
          <button type="button" onClick={() => handleModal("create")} className="btn-toolbar">
            New account
          </button>
        }
      >
      <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Account ID</th>
            <th>User ID</th>
            <th>Balance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.account_id}>
              <td>{account.account_id}</td>
              <td>{account.user_id}</td>
              <td>Frw {account.balance}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleModal("update", account)}
                    className="btn-table"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModal("deposit", account)}
                    className="btn-table"
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModal("withdraw", account)}
                    className="btn-table"
                  >
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(account.account_id)}
                    className="btn-table text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </Panel>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
          <button
               onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <Icon icon="bx:x-circle" fontSize={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {modalType === "create" && "Create Account"}
              {modalType === "update" && "Update Account"}
              {modalType === "deposit" && "Deposit to Account"}
              {modalType === "withdraw" && "Withdraw from Account"}
            </h2>

            {modalType === "create" && (
              <>
                <input
                  name="user_id"
                  placeholder="User ID"
                  value={formData.user_id}
                  onChange={handleChange}
                  className="w-full mb-4 px-3 py-2 border rounded"
                />
                <input
                  name="balance"
                  placeholder="Initial Balance"
                  value={formData.balance}
                  onChange={handleChange}
                  className="w-full mb-4 px-3 py-2 border rounded"
                />
                <button
                  onClick={handleCreate}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </>
            )}

            {modalType === "update" && (
              <>
                <input
                  name="balance"
                  placeholder="Balance"
                  value={formData.balance}
                  onChange={handleChange}
                  className="w-full mb-4 px-3 py-2 border rounded"
                />
                <button
                  onClick={handleUpdate}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-indigo-600"
                >
                  Update
                </button>
              </>
            )}

            {(modalType === "deposit" || modalType === "withdraw") && (
              <>
                <input
                  name="amount"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full mb-4 px-3 py-2 border rounded"
                />
                <input
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full mb-4 px-3 py-2 border rounded"
                />
                <button
                  onClick={modalType === "deposit" ? handleDeposit : handleWithdraw}
                  className={`${
                    modalType === "deposit" ? "bg-green-500" : "bg-yellow-500"
                  } text-white px-4 py-2 rounded hover:opacity-80`}
                >
                  {modalType === "deposit" ? "Deposit" : "Withdraw"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </UserShell>
  );
}

export default Account