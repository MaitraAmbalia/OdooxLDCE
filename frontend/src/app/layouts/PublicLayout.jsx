import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function PublicLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const isLeaderOrMentor = user?.roles && user.roles.some(r => 
    ['PRESIDENT', 'TREASURER', 'EVENT_HEAD', 'VOLUNTEER_HEAD', 'MARKETING_HEAD', 'MENTOR'].includes(r)
  );
  const isVolunteer = user?.isVolunteer || (user?.roles && user.roles.length > 0);

  const inManageArea = location.pathname.startsWith('/manage');
  const inVolunteerArea = location.pathname.startsWith('/volunteer');

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body flex flex-col">
      {/* Primary Global Navigation Header */}
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-xl font-display font-extrabold text-[var(--color-dusk)]">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-dusk)] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                S
              </span>
              <span>Skyline</span>
            </Link>

            {/* Core Public Navigation */}
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              <Link 
                to="/events" 
                className={`transition-colors hover:text-[var(--color-dusk)] ${location.pathname.startsWith('/events') ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
              >
                Events
              </Link>
              <Link 
                to="/shop" 
                className={`transition-colors hover:text-[var(--color-dusk)] ${location.pathname.startsWith('/shop') ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
              >
                Merch Store
              </Link>
              <Link 
                to="/announcements" 
                className={`transition-colors hover:text-[var(--color-dusk)] ${location.pathname.startsWith('/announcements') ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
              >
                Announcements
              </Link>
              <Link 
                to="/selection" 
                className={`transition-colors hover:text-[var(--color-dusk)] ${location.pathname.startsWith('/selection') ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
              >
                Leadership
              </Link>
            </nav>
          </div>

          {/* User & Role Specific Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                {/* Personal Hub Links */}
                <div className="flex items-center gap-3 text-sm">
                  <Link 
                    to="/me" 
                    className={`font-medium transition-colors hover:text-[var(--color-dusk)] ${location.pathname === '/me' ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
                  >
                    My Hub
                  </Link>
                  <Link 
                    to="/me/membership" 
                    className={`font-medium transition-colors hover:text-[var(--color-dusk)] ${location.pathname === '/me/membership' ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
                  >
                    Card
                  </Link>
                  <Link 
                    to="/me/tickets" 
                    className={`font-medium transition-colors hover:text-[var(--color-dusk)] ${location.pathname === '/me/tickets' ? 'text-[var(--color-dusk)] font-bold' : 'text-[var(--color-muted)]'}`}
                  >
                    Tickets
                  </Link>
                </div>

                <div className="h-4 w-px bg-[var(--color-line)]"></div>

                {/* Role Switchers */}
                {isVolunteer && (
                  <Link 
                    to="/volunteer" 
                    className={`text-xs px-2.5 py-1.5 rounded-md font-semibold border transition-all ${
                      inVolunteerArea 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    Volunteering
                  </Link>
                )}

                {isLeaderOrMentor && (
                  <Link 
                    to="/manage" 
                    className={`text-xs px-2.5 py-1.5 rounded-md font-semibold border transition-all ${
                      inManageArea 
                        ? 'bg-[var(--color-dusk)] text-white border-[var(--color-dusk)] shadow-sm' 
                        : 'bg-indigo-50 text-[var(--color-dusk)] border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    ⚡ Manage Hub
                  </Link>
                )}

                {/* User Pill */}
                <div className="flex items-center gap-2 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-full px-3 py-1 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-ok)]"></span>
                  <span className="font-semibold text-[var(--color-ink)] truncate max-w-[120px]">{user.name}</span>
                  {user.roles?.[0] && (
                    <span className="text-[10px] bg-[var(--color-line)] px-1.5 py-0.5 rounded text-[var(--color-muted)] font-mono">
                      {user.roles[0]}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-[var(--color-stop)] hover:underline ml-1"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-dusk)]">
                  Log in
                </Link>
                <Link 
                  to="/join" 
                  className="text-sm font-bold bg-[var(--color-lamp)] text-[var(--color-ink)] px-4 py-2 rounded-lg hover:brightness-105 transition-all shadow-sm"
                >
                  Join Membership
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-3">
            {user && (
              <span className="text-xs bg-[var(--color-paper)] border border-[var(--color-line)] px-2 py-1 rounded-full font-bold">
                {user.name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[var(--color-ink)] hover:bg-[var(--color-paper)] border border-[var(--color-line)]"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm font-medium pb-3 border-b border-[var(--color-line)]">
              <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded hover:bg-[var(--color-paper)]">Events</Link>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded hover:bg-[var(--color-paper)]">Merch Store</Link>
              <Link to="/announcements" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded hover:bg-[var(--color-paper)]">Announcements</Link>
              <Link to="/selection" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded hover:bg-[var(--color-paper)]">Leadership</Link>
            </div>
            {user ? (
              <div className="space-y-2 text-sm">
                <div className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">My Account</div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/me" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-[var(--color-paper)] rounded">My Hub</Link>
                  <Link to="/me/membership" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-[var(--color-paper)] rounded">Membership Card</Link>
                  <Link to="/me/tickets" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-[var(--color-paper)] rounded">My Tickets</Link>
                  <Link to="/me/orders" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-[var(--color-paper)] rounded">My Orders</Link>
                </div>
                {isVolunteer && (
                  <Link to="/volunteer" onClick={() => setMobileMenuOpen(false)} className="block p-2 text-center rounded bg-emerald-100 text-emerald-800 font-bold">
                    Volunteer Portal &rarr;
                  </Link>
                )}
                {isLeaderOrMentor && (
                  <Link to="/manage" onClick={() => setMobileMenuOpen(false)} className="block p-2 text-center rounded bg-indigo-100 text-indigo-900 font-bold">
                    Executive Manage Hub &rarr;
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left p-2 text-[var(--color-stop)] font-bold">
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 border rounded font-semibold">Log in</Link>
                <Link to="/join" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 bg-[var(--color-lamp)] text-[var(--color-ink)] font-bold rounded">Join</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Contextual Sub-Nav Bar for Manage Area */}
      {inManageArea && (
        <div className="bg-[#1E293B] text-white text-xs border-b border-slate-700 overflow-x-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 sm:gap-2 h-11 whitespace-nowrap">
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-2 text-[10px]">
              Manage:
            </span>
            <Link 
              to="/manage" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname === '/manage' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Dashboard Hub
            </Link>
            <Link 
              to="/manage/events/new" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname === '/manage/events/new' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              + Propose Event
            </Link>
            <Link 
              to="/manage/meetings" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/meetings') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Meetings & Agenda
            </Link>
            <Link 
              to="/manage/claims" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/claims') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Expense Claims
            </Link>
            <Link 
              to="/manage/finance/ledger" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/finance/ledger') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Ledger
            </Link>
            <Link 
              to="/manage/budget" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/budget') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Budgets
            </Link>
            <Link 
              to="/manage/projects" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/projects') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Fundraisers / Kanban
            </Link>
            <Link 
              to="/manage/orders" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/orders') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Merch Fulfilment
            </Link>
            <Link 
              to="/manage/announcements/new" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname.startsWith('/manage/announcements') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              + Announcement
            </Link>
          </div>
        </div>
      )}

      {/* Contextual Sub-Nav Bar for Volunteer Area */}
      {inVolunteerArea && (
        <div className="bg-emerald-900 text-white text-xs border-b border-emerald-800 overflow-x-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-11 whitespace-nowrap">
            <span className="font-bold text-emerald-300 uppercase tracking-wider mr-2 text-[10px]">
              Volunteer:
            </span>
            <Link 
              to="/volunteer" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname === '/volunteer' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200 hover:bg-emerald-800'}`}
            >
              My Tasks & Shifts
            </Link>
            <Link 
              to="/volunteer/claims/new" 
              className={`px-3 py-1.5 rounded font-medium transition-colors ${location.pathname === '/volunteer/claims/new' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200 hover:bg-emerald-800'}`}
            >
              + Submit Expense Claim
            </Link>
            <Link 
              to="/door/00000000-0000-0000-0000-000000000001" 
              className="px-3 py-1.5 rounded font-medium text-emerald-200 hover:bg-emerald-800"
            >
              Door Scanner 📷
            </Link>
            <Link 
              to="/cash-desk" 
              className="px-3 py-1.5 rounded font-medium text-emerald-200 hover:bg-emerald-800"
            >
              Cash Desk 💵
            </Link>
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      
      {/* Global Footer */}
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-muted)]">
          <div>
            &copy; {new Date().getFullYear()} Skyline Student Association. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/events" className="hover:underline">Events</Link>
            <Link to="/join" className="hover:underline">Membership</Link>
            <Link to="/shop" className="hover:underline">Merchandise</Link>
            <Link to="/announcements" className="hover:underline">News</Link>
            <Link to="/selection" className="hover:underline">Elections</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
