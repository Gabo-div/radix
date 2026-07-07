import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, User, Eye } from "lucide-react";

const roles = [
  {
    key: "admin",
    label: "Profesor (Admin)",
    desc: "Acceso total: crear cursos, subir archivos, monitorear el servidor",
    icon: GraduationCap,
    color: "border-emerald-600 hover:bg-emerald-900/20",
  },
  {
    key: "student",
    label: "Estudiante (User)",
    desc: "Acceso de ejecución: tomar lecciones, responder quizzes, ganar XP",
    icon: User,
    color: "border-indigo-600 hover:bg-indigo-900/20",
  },
  {
    key: "guest",
    label: "Invitado (Guest)",
    desc: "Solo lectura: explorar cursos y biblioteca sin interactuar",
    icon: Eye,
    color: "border-amber-600 hover:bg-amber-900/20",
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role: string) => {
    try {
      const redirect = await login(role);
      navigate(redirect, { replace: true });
    } catch (err) {
      alert("Error al iniciar sesión: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">
          RADIX
        </h1>
        <p className="text-slate-400 text-lg">
          Servidor de Borde — Amazonía
        </p>
        <div className="mt-4 inline-block bg-black px-4 py-2 rounded-lg font-mono text-xs text-emerald-400">
          $ ./radix-server --env=edge --region=amazonia
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {roles.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => handleLogin(r.key)}
              className={`bg-slate-800 border-2 ${r.color} rounded-xl p-6 text-left transition-all hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon size={28} className="text-slate-300" />
                <h2 className="text-lg font-semibold text-white">{r.label}</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="mt-10 text-xs text-slate-600">
        Simulador de servidor periférico offline v1.0.0
      </p>
    </div>
  );
}
