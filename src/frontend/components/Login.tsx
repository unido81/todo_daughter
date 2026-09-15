import { useState } from "react";
import type { Role } from "../lib/types";
import { api } from "../lib/api";

export default function Login({ onLoggedIn }: { onLoggedIn: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("daughter");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(role, password);
      onLoggedIn(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗓️</div>
          <h1 className="text-2xl font-bold">우리집 할일판</h1>
          <p className="text-sm text-black/50 mt-1">아빠와 딸만 사용하는 스케줄 앱</p>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setRole("daughter")}
              className={`py-3 rounded-2xl font-semibold transition ${
                role === "daughter" ? "bg-rose-400 text-white shadow" : "bg-black/5 text-black/50"
              }`}
            >
              👧 딸
            </button>
            <button
              type="button"
              onClick={() => setRole("dad")}
              className={`py-3 rounded-2xl font-semibold transition ${
                role === "dad" ? "bg-sky-400 text-white shadow" : "bg-black/5 text-black/50"
              }`}
            >
              👨 아빠
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
            />
            {error && <p className="text-sm text-red-600 px-1">{error}</p>}
            <button
              type="submit"
              disabled={loading || password.length === 0}
              className="w-full py-3 rounded-2xl bg-ink text-white font-semibold disabled:opacity-40"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
