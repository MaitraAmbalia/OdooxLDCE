import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body flex flex-col">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-display font-bold text-[var(--color-dusk)]">
            Skyline
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/events" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]">
              Events
            </Link>
            <Link to="/login" className="text-sm font-medium text-[var(--color-dusk)]">
              Log in
            </Link>
            <Link 
              to="/register" 
              className="text-sm font-medium bg-[var(--color-dusk)] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-opacity"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--color-muted)]">
          &copy; {new Date().getFullYear()} Skyline Student Association
        </div>
      </footer>
    </div>
  );
}
