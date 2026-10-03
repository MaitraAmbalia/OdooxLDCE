import React, { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, ShoppingBag, Megaphone, Award, LogOut, Menu, X, Zap, ChevronDown,
  Bell, LayoutDashboard, CreditCard, Ticket, Package, HandHelping, ScanLine,
  Banknote, PlusCircle, CalendarClock, Receipt, BookOpen, PiggyBank, KanbanSquare,
  Truck, Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const NAV_LINKS = [
  { name: "Events", path: "/events", icon: Calendar },
  { name: "Shop", path: "/shop", icon: ShoppingBag },
  { name: "News", path: "/announcements", icon: Megaphone },
  { name: "Leadership", path: "/selection", icon: Award },
];

const ACCOUNT_LINKS = [
  { name: "My Hub", path: "/me", icon: LayoutDashboard, end: true },
  { name: "Membership Card", path: "/me/membership", icon: CreditCard },
  { name: "My Tickets", path: "/me/tickets", icon: Ticket },
  { name: "My Orders", path: "/me/orders", icon: Package },
  { name: "Notifications", path: "/me/notifications", icon: Bell },
];

const MANAGE_LINKS = [
  { name: "Dashboard", path: "/manage", icon: LayoutDashboard, end: true },
  { name: "Propose Event", path: "/manage/events/new", icon: PlusCircle },
  { name: "Meetings", path: "/manage/meetings", icon: CalendarClock },
  { name: "Claims", path: "/manage/claims", icon: Receipt },
  { name: "Ledger", path: "/manage/finance/ledger", icon: BookOpen },
  { name: "Budgets", path: "/manage/budget", icon: PiggyBank },
  { name: "Projects", path: "/manage/projects", icon: KanbanSquare },
  { name: "Fulfilment", path: "/manage/orders", icon: Truck },
  { name: "Announce", path: "/manage/announcements/new", icon: Megaphone },
];

const VOLUNTEER_LINKS = [
  { name: "Tasks & Shifts", path: "/volunteer", icon: HandHelping, end: true },
  { name: "Submit Claim", path: "/volunteer/claims/new", icon: Receipt },
  { name: "Door Scanner", path: "/door/00000000-0000-0000-0000-000000000001", icon: ScanLine },
  { name: "Cash Desk", path: "/cash-desk", icon: Banknote },
];

const LEADER_ROLES = ['PRESIDENT', 'TREASURER', 'EVENT_HEAD', 'VOLUNTEER_HEAD', 'MARKETING_HEAD', 'MENTOR'];

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

function SubNav({ label, icon: Icon, links, tone }) {
  const dark = tone === "manage";
  return (
    <nav
      aria-label={label}
      className={cn(
        "text-sm border-b overflow-x-auto [scrollbar-width:none]",
        dark ? "bg-slate-900 border-slate-800" : "bg-emerald-950 border-emerald-900"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 h-12 whitespace-nowrap">
        <span className={cn("font-bold uppercase tracking-wider mr-2 text-[11px] flex items-center gap-1.5", dark ? "text-slate-400" : "text-emerald-400")}>
          <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
        </span>
        {links.map(({ name, path, icon: LinkIcon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors",
              isActive
                ? (dark ? "bg-blue-600 text-white" : "bg-emerald-600 text-white")
                : (dark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-emerald-100 hover:bg-emerald-900 hover:text-white")
            )}
          >
            <LinkIcon className="w-4 h-4 opacity-80" aria-hidden="true" />
            {name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2.5 py-1 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
          {initials(user.name)}
        </span>
        <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 page-enter">
          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            {user.roles?.[0] && (
              <span className="mt-1.5 inline-block text-[11px] font-mono font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                {user.roles[0].replace(/_/g, " ")}
              </span>
            )}
          </div>
          {ACCOUNT_LINKS.map(({ name, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" /> {name}
            </Link>
          ))}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Route change: close mobile menu, start new page at the top
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error(e);
    }
    queryClient.clear();
    navigate("/login");
    window.location.reload();
  };

  const isLeaderOrMentor = user?.roles?.some(r => LEADER_ROLES.includes(r));
  const isVolunteer = user?.isVolunteer || user?.roles?.length > 0;

  const inManageArea = location.pathname.startsWith('/manage');
  const inVolunteerArea = location.pathname.startsWith('/volunteer');

  const navLinkClass = ({ isActive }) => cn(
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  );

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body flex flex-col">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Skyline home">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-display font-extrabold text-base shadow-sm">
                S
              </span>
              <span className="text-xl font-display font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                Skyline
              </span>
            </Link>

            <nav aria-label="Main" className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ name, path, icon: Icon }) => (
                <NavLink key={path} to={path} className={navLinkClass}>
                  <Icon className="w-4 h-4 opacity-70" aria-hidden="true" />
                  <span>{name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isVolunteer && (
                  <NavLink
                    to="/volunteer"
                    className={({ isActive }) => cn(
                      "hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors",
                      isActive || inVolunteerArea ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                    )}
                  >
                    <HandHelping className="w-4 h-4" aria-hidden="true" /> Volunteer
                  </NavLink>
                )}
                {isLeaderOrMentor && (
                  <NavLink
                    to="/manage"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors",
                      inManageArea ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700"
                    )}
                  >
                    <Zap className="w-4 h-4" aria-hidden="true" /> Manage
                  </NavLink>
                )}
                <Link
                  to="/me/notifications"
                  aria-label="Notifications"
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                </Link>
                <AccountMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/join">
                  <Button variant="gold" size="sm">
                    <Shield className="w-4 h-4" aria-hidden="true" />
                    Join
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-5 shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto page-enter">
            <nav aria-label="Main" className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => cn(
                    "p-3 rounded-xl flex items-center gap-2 text-sm font-medium",
                    isActive ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700"
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" /> {name}
                </NavLink>
              ))}
            </nav>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 text-white text-sm font-bold flex items-center justify-center">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_LINKS.map(({ name, path, icon: Icon }) => (
                    <Link key={path} to={path} className="p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" /> {name}
                    </Link>
                  ))}
                </div>
                {isVolunteer && (
                  <Link to="/volunteer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold border border-emerald-200">
                    <HandHelping className="w-4 h-4" aria-hidden="true" /> Volunteer Portal
                  </Link>
                )}
                {isLeaderOrMentor && (
                  <Link to="/manage" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-900 text-sm font-semibold border border-blue-200">
                    <Zap className="w-4 h-4" aria-hidden="true" /> Manage Hub
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="w-full p-3 text-red-600 text-sm font-semibold flex items-center gap-2 rounded-xl hover:bg-red-50 cursor-pointer">
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link to="/join" className="flex-1">
                  <Button variant="gold" className="w-full">Join</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {inManageArea && <SubNav label="Manage" icon={Zap} links={MANAGE_LINKS} tone="manage" />}
      {inVolunteerArea && <SubNav label="Volunteer" icon={HandHelping} links={VOLUNTEER_LINKS} tone="volunteer" />}

      <main id="main" key={location.pathname} className="flex-1 flex flex-col page-enter">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center py-32" role="status" aria-label="Loading page">
            <span className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">S</span>
            <span>&copy; {new Date().getFullYear()} Skyline Student Association</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 font-medium text-slate-600">
            <Link to="/events" className="hover:text-blue-700 transition-colors">Events</Link>
            <Link to="/join" className="hover:text-blue-700 transition-colors">Membership</Link>
            <Link to="/shop" className="hover:text-blue-700 transition-colors">Shop</Link>
            <Link to="/announcements" className="hover:text-blue-700 transition-colors">News</Link>
            <Link to="/selection" className="hover:text-blue-700 transition-colors">Leadership</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
