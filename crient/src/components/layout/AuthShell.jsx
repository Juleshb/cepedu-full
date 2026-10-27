import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Logo from "../assets/logo.png";

const SUPPORT_PHONE = "+250792445913";

export default function AuthShell({
  title,
  subtitle = "Secure access to your cooperative account.",
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1920&q=80')",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-auth-wash" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="auth-panel"
        >
          <div className="mb-8 text-center">
            <img
              src={Logo}
              alt="CEPEDHU"
              className="mx-auto mb-5 h-20 w-20 object-contain"
            />
            <p className="brand-mark text-4xl md:text-5xl">CEPEDHU</p>
            <p className="brand-tagline mt-2 text-[11px]">Indatirwabahizi</p>
            <h1 className="display-md mt-6 text-stone-ink">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm font-normal text-stone-mute">{subtitle}</p>
            )}
          </div>

          {children}
        </motion.div>

        <a
          href={`https://wa.me/${SUPPORT_PHONE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 text-sm text-white/85 transition hover:text-accent"
        >
          <Icon icon="akar-icons:whatsapp-fill" className="text-lg" />
          Contact support
        </a>
      </div>
    </div>
  );
}
