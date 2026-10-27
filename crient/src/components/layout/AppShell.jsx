import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";
import { adminNavItems, userNavItems } from "./navItems";

function NavItem({ to, icon, label, active, onNavigate }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        className={`nav-link ${active ? "nav-link-active" : ""}`}
      >
        <Icon icon={icon} width="18" height="18" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

export function AppSidebar({ items, logoutTo, brandTo = "/" }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const close = () => setOpen(false);

  const navList = (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          active={isActive(item.to)}
          onNavigate={close}
        />
      ))}
    </ul>
  );

  const brand = (
    <Link to={brandTo} className="flex items-center gap-3" onClick={close}>
      <img src={logo} alt="CEPEDHU" className="h-11 w-11 object-contain" />
      <div>
        <p className="brand-mark text-xl leading-none">CEPEDHU</p>
        <p className="brand-tagline mt-1">Indatirwabahizi</p>
      </div>
    </Link>
  );

  const logoutLink = (
    <Link
      to={logoutTo}
      onClick={close}
      className="nav-link text-red-700 hover:bg-red-50 hover:text-red-800"
    >
      <Icon icon="material-symbols:logout" width="18" height="18" />
      <span>Logout</span>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-stone-line bg-stone-panel px-4 md:hidden">
        {brand}
        <button
          type="button"
          aria-label="Open menu"
          className="p-2 text-primary"
          onClick={() => setOpen(true)}
        >
          <Icon icon="ri:menu-2-fill" width="24" height="24" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-64 flex-col border-r border-stone-line bg-stone-panel px-5 py-6 md:flex">
        <div className="mb-10">{brand}</div>
        <nav className="flex-1 overflow-y-auto">{navList}</nav>
        <div className="mt-6 border-t border-stone-line pt-4">{logoutLink}</div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-50 bg-stone-ink/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              className="fixed bottom-0 left-0 top-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-stone-line bg-stone-panel px-5 py-6 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mb-8 flex items-start justify-between gap-3">
                {brand}
                <button
                  type="button"
                  aria-label="Close menu"
                  className="p-1 text-stone-mute"
                  onClick={close}
                >
                  <Icon icon="mdi:close" width="22" height="22" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto">{navList}</nav>
              <div className="mt-6 border-t border-stone-line pt-4">
                {logoutLink}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function AppTopBar({ title = "Overview" }) {
  const role = localStorage.getItem("role") || "member";

  return (
    <header className="sticky top-14 z-20 flex h-16 items-center justify-between border-b border-stone-line bg-stone-panel/90 px-6 backdrop-blur md:top-0">
      <div>
        <p className="brand-tagline">CEPEDHU · Indatirwabahizi</p>
        <h1 className="mt-0.5 text-xl font-normal leading-tight tracking-tight text-stone-ink md:text-2xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-normal capitalize text-stone-ink">{role}</p>
          <p className="text-xs font-normal text-stone-mute">Signed in</p>
        </div>
        <img
          src={logo}
          alt="CEPEDHU"
          className="h-10 w-10 rounded-full border border-stone-line bg-white object-contain p-0.5"
        />
      </div>
    </header>
  );
}

export default function AppShell({
  sidebarItems,
  logoutTo,
  brandTo,
  title,
  children,
}) {
  return (
    <div className="min-h-screen bg-paper-grain">
      <AppSidebar items={sidebarItems} logoutTo={logoutTo} brandTo={brandTo} />
      <div className="min-h-screen pt-14 md:ml-64 md:pt-0">
        <AppTopBar title={title} />
        <main className="px-4 pb-10 pt-6 md:px-8 md:pt-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ title, children }) {
  return (
    <AppShell
      sidebarItems={adminNavItems}
      logoutTo="/logout"
      brandTo="/dashboard"
      title={title}
    >
      {children}
    </AppShell>
  );
}

export function UserShell({ title, children }) {
  return (
    <AppShell
      sidebarItems={userNavItems}
      logoutTo="/userlogout"
      brandTo="/userdashboard"
      title={title}
    >
      {children}
    </AppShell>
  );
}

export function AdminPage({ title, children }) {
  const { adminNavItems } = require("../pages/Admin/Sidebar");
  return (
    <AppShell
      sidebarItems={adminNavItems}
      logoutTo="/logout"
      brandTo="/dashboard"
      title={title}
    >
      {children}
    </AppShell>
  );
}

export function UserPage({ title, children }) {
  const { userNavItems } = require("../pages/user/Sidebar");
  return (
    <AppShell
      sidebarItems={userNavItems}
      logoutTo="/userlogout"
      brandTo="/userdashboard"
      title={title}
    >
      {children}
    </AppShell>
  );
}
