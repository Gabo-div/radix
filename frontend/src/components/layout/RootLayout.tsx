import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function RootLayout() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
