import { useEffect, useState } from "react";
import type { Role } from "./lib/types";
import { api } from "./lib/api";
import Login from "./components/Login";
import DaughterDashboard from "./components/DaughterDashboard";
import DadDashboard from "./components/DadDashboard";

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((res) => setRole(res.role))
      .finally(() => setChecking(false));
  }, []);

  async function handleLogout() {
    await api.logout();
    setRole(null);
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-black/30">불러오는 중...</div>;
  }

  if (!role) {
    return <Login onLoggedIn={setRole} />;
  }

  return role === "daughter" ? (
    <DaughterDashboard onLogout={handleLogout} />
  ) : (
    <DadDashboard onLogout={handleLogout} />
  );
}
