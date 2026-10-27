import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Logout from "./components/Logout";
import OtpVerify from "./components/OtpVerify";
import ResetPassword from "./components/resetpassword";
import ForgotPassword from "./components/ForgotPassword";

import Dashboard from "./components/pages/Admin/Dashboard";
import UsersTable from "./components/pages/Admin/UsersTable";
import UserProfile from "./components/pages/Admin/UserProfile";
import Account from "./components/pages/Admin/Account";
import TransactionsTable from "./components/pages/Admin/TransactionsTable";
import Loans from "./components/pages/Admin/Loans";

import UserDashboard from "./components/pages/user/Dashboard";
import UserUsersTable from "./components/pages/user/UsersTable";
import UserAccount from "./components/pages/user/Account";
import UserTransactionsTable from "./components/pages/user/TransactionsTable";
import UserLoans from "./components/pages/user/Loans";
import Messages from "./components/pages/Messages";

import { AuthProvider } from "./components/authocontex";
import ProtectedRoute from "./components/ProtectedRoute";
import Notfound from "./components/404";
import { Icon } from "@iconify/react";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AuthProvider>
      {deferredPrompt && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-primary-dark bg-primary px-3 py-2 text-white">
          <Icon
            icon="line-md:bell-alert-filled"
            width="20"
            height="20"
            className="text-accent"
          />
          <p className="text-center text-xs font-medium">
            CEPEDHU is available for installation.{" "}
            <button
              type="button"
              className="underline"
              onClick={handleInstallClick}
            >
              Install app
            </button>
          </p>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/OtpVerify" element={<OtpVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/userlogout" element={<Logout />} />

        {/* Admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute requiredRole="admin">
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute requiredRole="admin">
              <TransactionsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute requiredRole="admin">
              <Loans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UsersTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute requiredRole="admin">
              <Messages audience="admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* Member */}
        <Route
          path="/userdashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/useraccount"
          element={
            <ProtectedRoute requiredRole="user">
              <UserAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usertransactions"
          element={
            <ProtectedRoute requiredRole="user">
              <UserTransactionsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userloans"
          element={
            <ProtectedRoute requiredRole="user">
              <UserLoans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usermessages"
          element={
            <ProtectedRoute requiredRole="user">
              <Messages audience="user" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userusers"
          element={
            <ProtectedRoute requiredRole="user">
              <UserUsersTable />
            </ProtectedRoute>
          }
        />

        {/* Legacy aliases */}
        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Account"
          element={
            <ProtectedRoute requiredRole="admin">
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Transactions"
          element={
            <ProtectedRoute requiredRole="admin">
              <TransactionsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userDashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userAccount"
          element={
            <ProtectedRoute requiredRole="user">
              <UserAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userTransactions"
          element={
            <ProtectedRoute requiredRole="user">
              <UserTransactionsTable />
            </ProtectedRoute>
          }
        />

        <Route path="/*" element={<Notfound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
