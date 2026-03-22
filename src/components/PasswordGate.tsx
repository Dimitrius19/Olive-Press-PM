import { useState, type FormEvent } from "react";

interface PasswordGateProps {
  onAuthenticated: (password: string) => void;
  error?: string;
}

export function PasswordGate({ onAuthenticated, error }: PasswordGateProps) {
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onAuthenticated(password);
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center relative overflow-hidden">
      <img
        src="/hotel-aerial.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-sm relative z-10 border border-white/30">
        <h1 className="text-2xl font-bold text-stone-800 mb-0.5">
          Olive Press Hotel 4*
        </h1>
        <p className="text-stone-500 text-sm mb-1">
          Renovation Project — Molyvos, Lesvos
        </p>
        <p className="text-stone-400 text-xs mb-6">
          Project Management Dashboard
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-800 bg-white/70 backdrop-blur-sm"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-[#1a2e1a] text-white rounded-lg font-medium hover:bg-[#243d24] transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
