import React from "react";
import { AppSidebar } from "../../layout/AppShell";
import { userNavItems } from "../../layout/navItems";

export { userNavItems };

export default function Sidebar() {
  return (
    <AppSidebar
      items={userNavItems}
      logoutTo="/userlogout"
      brandTo="/userdashboard"
    />
  );
}
