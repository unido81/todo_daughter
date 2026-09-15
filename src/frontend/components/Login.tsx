import { useState } from "react";
import type { Role } from "../lib/types";
import { api } from "../lib/api";
import Face, { type Expression } from "./Face";

const BLOBS: {
  color: string;
  shape: string;
  size: string;
  pos: string;
  tilt: string;
  delay: string;
  expression: Expression;
}[] = [
  { color: "bg-mint", shape: "rounded-full", size: "w-16 h-16", pos: "left-0 top-0", tilt: "-10deg", delay: "0s", expression: "content" },
  { color: "bg-lemon", shape: "rounded-[34%]", size: "w-12 h-12", pos: "left-1/2 -translate-x-1/2 top-3", tilt: "12deg", delay: "0.6s", expression: "happy" },
  { color: "bg-coral", shape: "rounded-[34%]", size: "w-16 h-16", pos: "right-0 top-1", tilt: "8deg", delay: "1.2s", expression: "neutral" },
  { color: "bg-bubble", shape: "rounded-[34%]", size: "w-12 h-12", pos: "left-4 bottom-0", tilt: "14deg", delay: "1.6s", expression: "sad" },
  { color: "bg-grape", shape: "rounded-full", size: "w-11 h-11", pos: "left-1/2 -translate-x-1/2 bottom-1", tilt: "-6deg", delay: "0.3s", expression: "sleepy" },
  { color: "bg-aqua", shape: "rounded-full", size: "w-14 h-14", pos: "right-3 bottom-0", tilt: "-12deg", delay: "0.9s", expression: "happy" },
];

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
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="relative h-64 mb-6">
          {BLOBS.map((b, i) => (
            <div
              key={i}
              style={{ "--tilt": b.tilt, animationDelay: b.delay } as React.CSSProperties}
              className={`absolute ${b.pos} ${b.size} ${b.color} ${b.shape} border-2 border-ink/10 flex items-center justify-center text-ink animate-floaty`}
            >
              <Face expression={b.expression} className="w-7 h-7" />
            </div>
          ))}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center px-2">
            <h1 className="text-[2.1rem] leading-[1.12] font-black tracking-tight">
              오늘 할일,
              <br />
              해볼까?
            </h1>
            <p className="text-sm font-semibold text-lilac-deep mt-2">우리집 할일판</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setRole("daughter")}
              className={`py-3.5 rounded-blob font-extrabold border-2 transition ${
                role === "daughter" ? "bg-bubble text-ink border-ink/10" : "bg-lilac text-ink/40 border-transparent"
              }`}
            >
              👧 딸
            </button>
            <button
              type="button"
              onClick={() => setRole("dad")}
              className={`py-3.5 rounded-blob font-extrabold border-2 transition ${
                role === "dad" ? "bg-aqua text-ink border-ink/10" : "bg-lilac text-ink/40 border-transparent"
              }`}
            >
              👨 아빠
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-blob bg-lilac-soft border-2 border-ink/10 px-5 py-3.5 font-semibold outline-none focus:border-grape transition"
            />
            {error && (
              <p className="text-sm font-semibold text-bubble-deep bg-bubble-soft border-2 border-bubble rounded-2xl px-4 py-2.5">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || password.length === 0}
              className="w-full py-4 rounded-blob bg-ink text-white font-extrabold text-lg disabled:opacity-30 active:translate-y-0.5 transition"
            >
              {loading ? "들어가는 중..." : "들어가기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
