import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, ShoppingBag, Bell, Award, User, Shield, LogOut, 
  Menu, X, Zap, ChevronDown, CheckCircle2, DollarSign, Users, FileText
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Toaster } from "sonner";

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

  const navLinks = [
    { name: "Events", path: "/events", icon: Calendar },
    { name: "Merch Store", path: "/shop", icon: ShoppingBag },
    { name: "Announcements", path: "/announcements", icon: Bell },
    { name: "Leadership", path: "/selection", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Primary Global Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-display font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
                S
              </span>
              <span className="text-xl font-display font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                Skyline
              </span>
            </Link>

            {/* Core Public Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-slate-100 text-blue-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User & Role Specific Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                {/* Personal Hub Links */}
                <div className="flex items-center gap-1 text-xs">
                  <Link 
                    to="/me" 
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      location.pathname === '/me' ? 'text-blue-700 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Hub
                  </Link>
                  <Link 
                    to="/me/membership" 
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      location.pathname === '/me/membership' ? 'text-blue-700 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Digital Card
                  </Link>
                  <Link 
                    to="/me/tickets" 
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      location.pathname === '/me/tickets' ? 'text-blue-700 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Passes
                  </Link>
                </div>

                <div className="h-4 w-px bg-slate-200"></div>

                {/* Role Switcher Badges */}
                {isVolunteer && (
                  <Link to="/volunteer">
                    <Badge variant={inVolunteerArea ? "success" : "default"} className="cursor-pointer hover:border-emerald-300">
                      🤝 Volunteer Portal
                    </Badge>
                  </Link>
                )}

                {isLeaderOrMentor && (
                  <Link to="/manage">
                    <Badge variant={inManageArea ? "primary" : "outline"} className="cursor-pointer hover:border-blue-400 font-bold">
                      <Zap className="w-3 h-3 text-blue-600 mr-0.5" /> Manage Hub
                    </Badge>
                  </Link>
                )}

                {/* User Pill */}
                <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 rounded-full pl-2 pr-3 py-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">{user.name}</span>
                  {user.roles?.[0] && (
                    <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded font-mono font-medium text-slate-600">
                      {user.roles[0]}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/join">
                  <Button variant="gold" size="sm">
                    <Shield className="w-3.5 h-3.5 text-amber-950" />
                    Join Membership
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded-full font-bold text-slate-800">
                {user.name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold pb-3 border-b border-slate-100">
              <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Events
              </Link>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" /> Merch Store
              </Link>
              <Link to="/announcements" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" /> Announcements
              </Link>
              <Link to="/selection" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" /> Leadership
              </Link>
            </div>

            {user ? (
              <div className="space-y-3 text-xs">
                <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Personal Hub</div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/me" onClick={() => setMobileMenuOpen(false)} className="p-2.5 bg-slate-50 rounded-lg font-medium">My Account</Link>
                  <Link to="/me/membership" onClick={() => setMobileMenuOpen(false)} className="p-2.5 bg-slate-50 rounded-lg font-medium">Membership Card</Link>
                  <Link to="/me/tickets" onClick={() => setMobileMenuOpen(false)} className="p-2.5 bg-slate-50 rounded-lg font-medium">My Tickets</Link>
                  <Link to="/me/orders" onClick={() => setMobileMenuOpen(false)} className="p-2.5 bg-slate-50 rounded-lg font-medium">My Orders</Link>
                </div>
                {isVolunteer && (
                  <Link to="/volunteer" onClick={() => setMobileMenuOpen(false)} className="block p-2.5 text-center rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    🤝 Volunteer Portal &rarr;
                  </Link>
                )}
                {isLeaderOrMentor && (
                  <Link to="/manage" onClick={() => setMobileMenuOpen(false)} className="block p-2.5 text-center rounded-xl bg-blue-50 text-blue-900 font-bold border border-blue-200">
                    ⚡ Executive Manage Hub &rarr;
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left p-2.5 text-red-600 font-bold flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Log in</Button>
                </Link>
                <Link to="/join" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="gold" size="sm" className="w-full">Join Membership</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Contextual Sub-Nav Bar for Manage Area */}
      {inManageArea && (
        <div className="bg-slate-900 text-white text-xs border-b border-slate-800 overflow-x-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 h-11 whitespace-nowrap">
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-2 text-[10px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-400" /> Manage:
            </span>
            <Link 
              to="/manage" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/manage' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Dashboard Hub
            </Link>
            <Link 
              to="/manage/events/new" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/manage/events/new' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              + Propose Event
            </Link>
            <Link 
              to="/manage/meetings" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/meetings') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Meetings & Agenda
            </Link>
            <Link 
              to="/manage/claims" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/claims') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Expense Claims
            </Link>
            <Link 
              to="/manage/finance/ledger" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/finance/ledger') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              General Ledger
            </Link>
            <Link 
              to="/manage/budget" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/budget') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Budgets
            </Link>
            <Link 
              to="/manage/projects" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/projects') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Fundraisers / Kanban
            </Link>
            <Link 
              to="/manage/orders" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/orders') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Merch Fulfilment
            </Link>
            <Link 
              to="/manage/announcements/new" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/manage/announcements') ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              + Announcement
            </Link>
          </div>
        </div>
      )}

      {/* Contextual Sub-Nav Bar for Volunteer Area */}
      {inVolunteerArea && (
        <div className="bg-emerald-950 text-white text-xs border-b border-emerald-900 overflow-x-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 h-11 whitespace-nowrap">
            <span className="font-bold text-emerald-400 uppercase tracking-wider mr-2 text-[10px]">
              🤝 Volunteer:
            </span>
            <Link 
              to="/volunteer" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/volunteer' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-emerald-200 hover:bg-emerald-900'}`}
            >
              My Tasks & Shifts
            </Link>
            <Link 
              to="/volunteer/claims/new" 
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/volunteer/claims/new' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-emerald-200 hover:bg-emerald-900'}`}
            >
              + Submit Expense Claim
            </Link>
            <Link 
              to="/door/00000000-0000-0000-0000-000000000001" 
              className="px-3 py-1.5 rounded-lg font-medium text-emerald-200 hover:bg-emerald-900 flex items-center gap-1"
            >
              📷 Door Scanner
            </Link>
            <Link 
              to="/cash-desk" 
              className="px-3 py-1.5 rounded-lg font-medium text-emerald-200 hover:bg-emerald-900 flex items-center gap-1"
            >
              💵 Cash Desk
            </Link>
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      
      {/* Global Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
              S
            </span>
            <span>&copy; {new Date().getFullYear()} Skyline Student Association. LDCE & Nirma University.</span>
          </div>
          <div className="flex items-center gap-6 font-medium text-slate-600">
            <Link to="/events" className="hover:text-blue-700 transition-colors">Events</Link>
            <Link to="/join" className="hover:text-blue-700 transition-colors">Membership</Link>
            <Link to="/shop" className="hover:text-blue-700 transition-colors">Merchandise</Link>
            <Link to="/announcements" className="hover:text-blue-700 transition-colors">News</Link>
            <Link to="/selection" className="hover:text-blue-700 transition-colors">Leadership</Link>
          </div>
        </div>
      </footer>
      <Toaster richColors position="top-right" closeButton theme="light" />
    </div>
  );
}
