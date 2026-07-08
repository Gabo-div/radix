import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye } from "lucide-react";

export default function Login() {
  const { login, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirect = await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    try {
      const redirect = await loginGuest();
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">RADIX</h1>
        <p className="text-slate-400 text-lg">Servidor de Borde — Amazonía</p>
        <div className="mt-4 inline-block bg-black px-4 py-2 rounded-lg font-mono text-xs text-emerald-400">
          $ ./radix-server --env=edge --region=amazonia
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border-2 border-slate-700 rounded-xl p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <div>
          <label className="block text-sm text-slate-400 mb-1" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            placeholder="tucorreo@radix.local"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <button
          type="button"
          onClick={handleGuest}
          className="flex items-center justify-center gap-2 text-sm text-amber-400 hover:text-amber-300 mt-2"
        >
          <Eye size={16} />
          Entrar como invitado (solo lectura)
        </button>
      </form>

      <p className="mt-10 text-xs text-slate-600">
        Simulador de servidor periférico offline v1.0.0
      </p>
    </div>
  );
}
