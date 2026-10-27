import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "./layout/AuthShell";

const ResetPassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Unauthorized access. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:4000/api/users/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message);
        setErrorMessage("");

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setErrorMessage(data.message);
        setSuccessMessage("");
      }
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again.");
      setSuccessMessage("");
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="Update your password before continuing to the dashboard."
    >
      {successMessage && <div className="alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert-error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-1.5 block text-sm font-medium text-stone-ink"
          >
            Current password
          </label>
          <input
            id="currentPassword"
            className="input-field"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="newPassword"
            className="mb-1.5 block text-sm font-medium text-stone-ink"
          >
            New password
          </label>
          <input
            id="newPassword"
            className="input-field"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Save password
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
