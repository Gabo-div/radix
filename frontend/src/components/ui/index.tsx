import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    ghost: "bg-transparent hover:bg-slate-700 text-slate-300",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, max = 100, className = "" }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={`w-full bg-slate-700 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Badge({ children, color = "slate" }: { children: ReactNode; color?: "emerald" | "indigo" | "amber" | "slate" | "red" }) {
  const colors = {
    emerald: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    indigo: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
    amber: "bg-amber-900/50 text-amber-300 border-amber-700",
    slate: "bg-slate-700 text-slate-300 border-slate-600",
    red: "bg-red-900/50 text-red-300 border-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
}
