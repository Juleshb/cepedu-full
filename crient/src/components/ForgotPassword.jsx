import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthShell from "./layout/AuthShell";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        "/api/users/forgot-password",
        { emailOrPhone }
      );

      setSuccessMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        "/api/users/confirm-reset-password",
        {
          emailOrPhone,
          otp,
          newPassword,
        }
      );

      setSuccessMessage(response.data.message);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Forgot password" : "Set new password"}
      subtitle={
        step === 1
          ? "We will send a one-time code to your email or phone."
          : "Enter the OTP and choose a new password."
      }
    >
      {successMessage && <div className="alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert-error">{errorMessage}</div>}

      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label
              htmlFor="emailOrPhone"
              className="mb-1.5 block text-sm font-medium text-stone-ink"
            >
              Email or phone
            </label>
            <input
              id="emailOrPhone"
              className="input-field"
              type="text"
              placeholder="Enter your email or phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label
              htmlFor="otp"
              className="mb-1.5 block text-sm font-medium text-stone-ink"
            >
              OTP
            </label>
            <input
              id="otp"
              className="input-field"
              type="text"
              placeholder="Enter the OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-stone-mute">
        <Link to="/" className="btn-ghost">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPassword;
