import React from "react";
import { AppSidebar } from "../../layout/AppShell";
import { adminNavItems } from "../../layout/navItems";

export { adminNavItems };

export default function Sidebar() {
  return (
    <AppSidebar
      items={adminNavItems}
      logoutTo="/logout"
      brandTo="/dashboard"
    />
  );
}
