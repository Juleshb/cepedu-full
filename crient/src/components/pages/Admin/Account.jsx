import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import "react-toastify/dist/ReactToastify.css";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import Logo from "../../assets/logo.png";
import { AdminShell } from "../../layout/AppShell";
import { Panel, SectionHeading } from "../../layout/DashboardUI";


function Account() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;
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
    fetchAccounts();
}, []);

const fetchAccounts = async () => {
    try {
        const response = await axiosInstance.get("/accounts");
        setAccounts(response.data);
        setFilteredUsers(response.data); 
        setLoading(false);
    } catch (error) {
        toast.error("Failed to fetch accounts.");
        setLoading(false);
    }
};

const handleSearch = (e) => {
  const query = e.target.value.toLowerCase();
  setSearchQuery(query);

  const filtered = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(query) ||
      account.email.toLowerCase().includes(query)
  );

  setFilteredUsers(filtered);
};

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

  
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && (file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        setSelectedFile(file);
        toast.success(`Selected file: ${file.name}`);
    } else {
        toast.error("Invalid file type. Please upload an Excel file (.xls or .xlsx). ");
    }
};

const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".xlsx,.xls",
});

const handleUploadClick = () => {
    if (selectedFile) {
        handleFileUpload(selectedFile);
    } else {
        toast.error("Please select a file before uploading.");
    }
};

const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setProgress(0);
    try {
        await axiosInstance.post("/accounts/batch-deposit", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(percentCompleted);
            },
        });
        toast.success("Batch deposit processed successfully.");
        setSelectedFile(null);
        fetchAccounts();
    } catch (error) {
        toast.error("Failed to process batch deposits.");
    } finally {
        setUploading(false);
    }
};

  const handleExport = () => {
    if (accounts.length === 0) {
      alert("No data to export!");
      return;
    }

    const transformedData = accounts.map((account) => ({
      account_id: account.account_id,
      accountnumber: account.accountnumber,
      name: account.name,
      email: account.email,
      balance: account.balance,
      amount: "", 
      description: "", 
    }));

    const now = new Date();
    const formattedDate = now.toISOString().replace(/T/, " ").replace(/:/g, "-").split(".")[0]; 
    const sheetName = `cepedhu ${formattedDate}`;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName); 
    XLSX.writeFile(workbook, `cepedhu_${formattedDate}.xlsx`);
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

  if (loading) return(
    <div className="flex bg-primary justify-center items-center h-screen">
    <motion.img 
        src={Logo}
        alt="Loading..." 
        className="h-36"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
  );
  if (error) return <p>{error}</p>;

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstLog, indexOfLastLog);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  return (
    <AdminShell title="Accounts">
      <Toaster position="top-center" reverseOrder={false} />
      <SectionHeading
        title="Deposit & withdraw"
        subtitle="Manage member balances and process batch deposits."
      />

      <Panel
        title="Batch deposit upload"
        className="mb-5"
        action={
          <button type="button" onClick={handleExport} className="btn-toolbar-outline">
            <Icon icon="mdi:file-excel-outline" width="18" height="18" />
            Export template
          </button>
        }
      >
        <motion.div
          {...getRootProps()}
          className="mb-4 flex h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-primary bg-primary-muted/30 p-4 text-xs transition hover:bg-primary-muted/50"
          whileHover={{ scale: 1.01 }}
        >
          <input {...getInputProps()} />
          <Icon icon="mdi:file-excel-outline" width="24" height="24" className="text-primary" />
          <p className="mt-2 text-center text-primary">
            {selectedFile
              ? selectedFile.name
              : "Drag & drop an Excel file, or click to select"}
          </p>
        </motion.div>
        {uploading && (
          <div className="mb-4 h-2 w-full overflow-hidden bg-stone-line">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="btn-toolbar"
        >
          {uploading ? (
            <>
              <Icon icon="line-md:loading-loop" width="16" height="16" />
              Uploading… {progress}%
            </>
          ) : (
            <>
              <Icon icon="line-md:cloud-alt-upload-loop" width="18" height="18" />
              Upload
            </>
          )}
        </button>
      </Panel>

      <Panel
        title="Accounts"
        action={
          <input
            type="text"
            placeholder="Search name, email, or account…"
            value={searchQuery}
            onChange={handleSearch}
            className="input-field w-full max-w-xs py-2 text-sm"
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Names</th>
                <th>NID</th>
                <th>Account</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((account) => (
                  <tr key={account.account_id}>
                    <td className="font-medium">{account.name}</td>
                    <td>{account.identification_number}</td>
                    <td>{account.accountnumber}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-mute">
                    No account found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-6 flex items-center justify-between border-t border-stone-line pt-4">
            <button
              type="button"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-sm font-medium text-primary disabled:opacity-40"
            >
              Previous
            </button>
            <p className="text-xs text-stone-mute">
              {currentPage} /{" "}
              {Math.max(1, Math.ceil(filteredUsers.length / logsPerPage))}
            </p>
            <button
              type="button"
              onClick={() => paginate(currentPage + 1)}
              disabled={
                currentPage === Math.ceil(filteredUsers.length / logsPerPage)
              }
              className="text-sm font-medium text-primary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Panel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="relative w-full max-w-md border border-stone-line bg-stone-panel p-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-stone-mute hover:text-primary"
            >
              <Icon icon="bx:x-circle" fontSize={24} />
            </button>
            <h2 className="mb-4 text-2xl font-normal tracking-tight text-stone-ink">
              {modalType === "create" && "Create account"}
              {modalType === "update" && "Update account"}
              {modalType === "deposit" && "Deposit to account"}
              {modalType === "withdraw" && "Withdraw from account"}
            </h2>

            {modalType === "create" && (
              <div className="space-y-3">
                <input
                  name="user_id"
                  placeholder="User ID"
                  value={formData.user_id}
                  onChange={handleChange}
                  className="input-field"
                />
                <input
                  name="balance"
                  placeholder="Initial balance"
                  value={formData.balance}
                  onChange={handleChange}
                  className="input-field"
                />
                <button type="button" onClick={handleCreate} className="btn-toolbar">
                  Create
                </button>
              </div>
            )}

            {modalType === "update" && (
              <div className="space-y-3">
                <input
                  name="balance"
                  placeholder="Balance"
                  value={formData.balance}
                  onChange={handleChange}
                  className="input-field"
                />
                <button type="button" onClick={handleUpdate} className="btn-toolbar">
                  Update
                </button>
              </div>
            )}

            {(modalType === "deposit" || modalType === "withdraw") && (
              <div className="space-y-3">
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
                <button
                  type="button"
                  onClick={
                    modalType === "deposit" ? handleDeposit : handleWithdraw
                  }
                  className="btn-toolbar"
                >
                  {modalType === "deposit" ? "Deposit" : "Withdraw"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default Account