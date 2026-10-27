import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "./authocontex";
import AuthShell from "./layout/AuthShell";

function OtpVerify() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { setAuthData } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.slice(0, 6).split("");
    const filledOtp = [...otp];
    newOtp.forEach((digit, index) => {
      filledOtp[index] = digit;
    });
    setOtp(filledOtp);

    const nextEmptyIndex = newOtp.length < 6 ? newOtp.length : 5;
    document.getElementById(`otp-${nextEmptyIndex}`).focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const otpValue = otp.join("");
    const OtpVerifyPayload = {
      emailOrPhone: email,
      otp: otpValue,
    };

    try {
      const response = await axios.post(
        "http://localhost:4000/api/users/confirm-login",
        OtpVerifyPayload
      );

      if (response.status === 200) {
        const { token, role, firstTimeLogin } = response.data;

        setAuthData({ token, role });
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);

        if (firstTimeLogin) {
          navigate("/reset-password");
        } else {
          setSuccessMessage("OTP verified successfully");
          setShowSuccessMessage(true);
          setShowFailureMessage(false);

          if (role === "admin") {
            navigate("/dashboard");
          } else if (role === "user") {
            navigate("/userdashboard");
          } else {
            navigate("/unauthorized");
          }
        }
      } else {
        setErrorMessage("Invalid or expired OTP");
        setShowSuccessMessage(false);
        setShowFailureMessage(true);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid or expired OTP");
      setShowSuccessMessage(false);
      setShowFailureMessage(true);
    }
  };

  const closeSuccessMessage = () => setShowSuccessMessage(false);
  const closeFailureMessage = () => setShowFailureMessage(false);

  return (
    <AuthShell
      title="Verify OTP"
      subtitle={
        email
          ? `Enter the code sent to ${email}.`
          : "Enter the six-digit code from your email."
      }
    >
      {showSuccessMessage && (
        <div className="alert-success flex items-center justify-between gap-3">
          <span>{successMessage}</span>
          <button type="button" className="btn-ghost" onClick={closeSuccessMessage}>
            Close
          </button>
        </div>
      )}

      {showFailureMessage && (
        <div className="alert-error flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button type="button" className="btn-ghost" onClick={closeFailureMessage}>
            Close
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input type="email" value={email} readOnly className="hidden" />

        <div className="mb-6 flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              onKeyDown={(e) => handleOtpKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="h-12 w-11 border border-stone-line bg-stone-panel text-center text-lg font-normal tracking-tight text-stone-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              required
            />
          ))}
        </div>

        <button type="submit" className="btn-primary">
          Verify OTP
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-mute">
        <Link to="/" className="btn-ghost">
          Resend OTP
        </Link>
      </p>
    </AuthShell>
  );
}

export default OtpVerify;
