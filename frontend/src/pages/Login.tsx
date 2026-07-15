import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1.5">RADIX</h1>
        <p className="text-muted-foreground text-sm">Servidor de Borde — Amazonía</p>
        <div className="mt-4 inline-block border border-border/60 bg-card px-3 py-1.5 rounded-md font-mono text-xs text-success/90">
          $ ./radix-server --env=edge --region=amazonia
        </div>
      </div>

      <Card className="w-full max-w-sm p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email" className="block mb-1.5">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@radix.local"
            />
          </div>
          <div>
            <Label htmlFor="password" className="block mb-1.5">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>

          <Button type="button" variant="link" onClick={handleGuest} className="text-warning mt-2">
            <Eye size={16} />
            Entrar como invitado (solo lectura)
          </Button>
        </form>
      </Card>

      <p className="mt-10 text-xs text-muted-foreground/60">
        Simulador de servidor periférico offline v1.0.0
      </p>
    </div>
  );
}
