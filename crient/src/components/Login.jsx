import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Logo from "./assets/logo.png";

const SUPPORT_PHONE = "+250792445913";

function Login() {
  const [emailOrPhone, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoader, setShowLoader] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowLoader(true);
    setShowFailureMessage(false);

    try {
      const response = await axios.post(
        "/api/users/login",
        { emailOrPhone, password }
      );

      if (response.status === 200) {
        localStorage.setItem("email", emailOrPhone);
        navigate("/OtpVerify");
      }
    } catch (error) {
      setShowLoader(false);

      if (error.response) {
        if (error.response.status === 404) {
          setErrorMessage("User not found. Please check your email or phone.");
        } else if (error.response.status === 400 || error.response.status === 401) {
          setErrorMessage("Invalid credentials. Please check your password.");
        } else {
          setErrorMessage("Failed to login. Please try again.");
        }
      } else {
        setErrorMessage("An error occurred during login. Please try again.");
      }

      setShowFailureMessage(true);
    }
  };

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand plane — full-bleed on desktop */}
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=80')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(20,56,46,0.94) 0%, rgba(27,77,62,0.82) 48%, rgba(26,26,24,0.72) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(196,163,90,0.35), transparent 42%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08), transparent 40%)",
          }}
          aria-hidden
        />

        <motion.div
          className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-4">
            <img
              src={Logo}
              alt="CEPEDHU"
              className="h-20 w-20 object-contain xl:h-24 xl:w-24"
            />
            <span className="text-xs font-normal uppercase tracking-[0.22em] text-white/70">
              Cooperative banking
            </span>
          </div>

          <div className="max-w-lg">
            <p className="display-xl text-white">CEPEDHU</p>
            <p className="mt-3 text-sm font-normal uppercase tracking-[0.28em] text-accent-soft">
              Indatirwabahizi
            </p>
            <p className="mt-8 max-w-md text-lg font-normal leading-relaxed text-white/80">
              Secure access to savings, loans, and member services — built for
              your cooperative community.
            </p>
          </div>

          <p className="text-sm text-white/50">
            Trusted member portal · Encrypted session
          </p>
        </motion.div>
      </aside>

      {/* Form column */}
      <main className="relative flex min-h-screen flex-col bg-stone-page">
        <div
          className="pointer-events-none absolute inset-0 bg-paper-grain opacity-80"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src={Logo} alt="CEPEDHU" className="h-16 w-16 object-contain" />
            <div>
              <p className="brand-mark text-2xl leading-none">CEPEDHU</p>
              <p className="brand-tagline mt-1">Indatirwabahizi</p>
            </div>
          </div>

          <div className="my-auto w-full max-w-md mx-auto lg:mx-0 lg:max-w-[26rem]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              <p className="text-xs font-normal uppercase tracking-[0.2em] text-primary">
                Sign in
              </p>
              <h1 className="display-md mt-3 text-stone-ink">Welcome back</h1>
              <p className="mt-3 text-base font-normal text-stone-mute">
                Enter your credentials to continue to your account.
              </p>

              {showFailureMessage && (
                <div className="alert-error mt-6" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="emailOrPhone"
                    className="mb-2 block text-sm font-medium text-stone-ink"
                  >
                    Email or phone
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-mute">
                      <Icon icon="solar:user-linear" width="18" height="18" />
                    </span>
                    <input
                      id="emailOrPhone"
                      type="text"
                      autoComplete="username"
                      placeholder="name@example.com or phone"
                      value={emailOrPhone}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-stone-ink"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary transition hover:text-primary-dark"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-mute">
                      <Icon icon="solar:lock-linear" width="18" height="18" />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-11 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-mute transition hover:text-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Icon
                        icon={
                          showPassword
                            ? "solar:eye-closed-linear"
                            : "solar:eye-linear"
                        }
                        width="18"
                        height="18"
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-2 flex h-12 items-center justify-center gap-2"
                  disabled={showLoader}
                >
                  {showLoader ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue
                      <Icon icon="solar:arrow-right-linear" width="18" height="18" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 flex items-center gap-4">
                <div className="h-px flex-1 bg-stone-line" />
                <span className="text-xs uppercase tracking-[0.16em] text-stone-mute">
                  or
                </span>
                <div className="h-px flex-1 bg-stone-line" />
              </div>

              <p className="mt-6 text-sm text-stone-mute">
                Don&apos;t have an account?{" "}
                <Link
                  to="/Signup"
                  className="font-semibold text-primary transition hover:text-primary-dark"
                >
                  Request membership
                </Link>
              </p>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-stone-line pt-6 text-sm text-stone-mute">
            <a
              href={`https://wa.me/${SUPPORT_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-primary"
            >
              <Icon icon="akar-icons:whatsapp-fill" width="16" height="16" />
              Contact support
            </a>
            <span className="text-xs">© {new Date().getFullYear()} CEPEDHU</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
