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
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm relative z-10">
        <h1 className="text-2xl font-bold text-stone-800 mb-1">
          Olive Press Hotel
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Project Management Dashboard
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-600 text-stone-800"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
