import React from "react";
import { AppTopBar } from "../../layout/AppShell";

export default function Navbar({ title = "Overview" }) {
  return <AppTopBar title={title} />;
}
