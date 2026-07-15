import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-6">Página no encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
        >
          <Home size={16} />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
