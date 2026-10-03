import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function PublicLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const user = authData?.data;

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      queryClient.clear();
      navigate("/login");
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

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

            {user ? (
              <>
                <Link to="/me/membership" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                  Membership
                </Link>
                <Link to="/me/tickets" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                  My Tickets
                </Link>
                {(user.roles?.includes('TREASURER') || user.roles?.includes('PRESIDENT')) && (
                  <Link to="/manage/finance/ledger" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                    Treasurer
                  </Link>
                )}
                <span className="text-xs bg-[var(--color-paper)] px-2.5 py-1 rounded-full font-medium text-[var(--color-ink)] border border-[var(--color-line)]">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-[var(--color-stop)] hover:underline"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[var(--color-dusk)]">
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className="text-sm font-medium bg-[var(--color-dusk)] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-opacity"
                >
                  Join
                </Link>
              </>
            )}
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
