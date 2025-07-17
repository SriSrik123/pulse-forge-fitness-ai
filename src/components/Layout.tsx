
import { Outlet } from "react-router-dom";
import { Navigation } from "./Navigation";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-20"> {/* Increased top padding to avoid navbar overlap */}
        <Outlet />
      </main>
    </div>
  );
}
