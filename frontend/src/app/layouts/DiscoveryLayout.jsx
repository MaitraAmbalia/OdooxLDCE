import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  HeartHandshake,
  LogOut,
  Menu,
  Mountain,
  UserRound,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

const manageNavigationItems = [
  { to: "/manage", label: "Overview" },
  { to: "/calendar", label: "Calendar" },
  { to: "/manage/events", label: "Events", anyPermission: ["event.propose", "event.approve", "event.report.read", "event.publish"] },
  { to: "/manage/sponsorship", label: "Sponsorship", anyPermission: ["sponsorship.crm.read", "sponsorship.crm.manage"] },
  { to: "/manage/claims", label: "Claims", anyPermission: ["claim.review", "claim.review.high", "claim.review.treasurer", "claim.pay"] },
  { to: "/manage/cash", label: "Cash", anyPermission: ["cash.verify"] },
  { to: "/manage/memberships", label: "Dues", anyPermission: ["member.read.any", "membership.tier.manage"] },
  { to: "/manage/finance/ledger", label: "Ledger", anyPermission: ["ledger.read"] },
  { to: "/manage/budget", label: "Budgets", anyPermission: ["budget.limit.manage", "budget.allocate"] },
  { to: "/manage/finance/reports", label: "Reports", anyPermission: ["finance.report.read"] },
  { to: "/manage/projects", label: "Projects", anyPermission: ["project.manage", "volunteer.manage"] },
  { to: "/manage/orders", label: "Orders", anyPermission: ["order.fulfil"] },
  { to: "/manage/newsletter", label: "Newsletter", anyPermission: ["newsletter.send", "newsletter.stats.read"] },
  { to: "/manage/selection/new/edit", label: "Leadership", anyPermission: ["selection.manage"] },
];

const volunteerNavigation = [
  ["/volunteer", "My work"],
  ["/volunteer/claims/new", "Submit a claim"],
];

export function Brand() {
  return (
    <Link
      to="/"
      aria-label="Skyline home"
      className="inline-flex shrink-0 items-center gap-2.5"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Mountain className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="font-display text-2xl font-bold tracking-tight">
        skyline<span className="text-primary">.</span>
      </span>
    </Link>
  );
}

export default function DiscoveryLayout() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { data, isPending, isError, refetch } = useSession();
  const user = data?.data;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const userPermissions = user?.permissions || [];
  const filteredManageNav = useMemo(() => {
    return manageNavigationItems
      .filter((item) => !item.anyPermission || item.anyPermission.some((perm) => userPermissions.includes(perm)))
      .map((item) => [item.to, item.label]);
  }, [userPermissions]);

  const isLeadership = Boolean(
    user && user.roles?.some((role) =>
      [
        "PRESIDENT",
        "TREASURER",
        "EVENT_HEAD",
        "VOLUNTEER_HEAD",
        "MARKETING_HEAD",
        "SPONSORSHIP_HEAD",
        "MENTOR",
      ].includes(role)
    )
  );

  // Option 3: Role-Aware Dynamic Top Navigation
  const primaryNavigation = useMemo(() => {
    if (!user) {
      return [
        ["/", "Home"],
        ["/events", "Events"],
        ["/calendar", "Calendar"],
        ["/shop", "Shop"],
        ["/announcements", "Updates"],
        ["/selection", "Apply"],
      ];
    }

    const roles = user.roles || [];
    const isVolunteer = Boolean(user.isVolunteer || roles.includes("VOLUNTEER"));

    // 1. MENTOR (Supervisory Governance)
    if (roles.includes("MENTOR")) {
      return [
        ["/manage", "Console"],
        ["/manage/events", "Review Proposals"],
        ["/manage/budget", "Budgets & Limits"],
        ["/manage/finance/ledger", "Ledger Audit"],
        ["/manage/selection/new/edit", "Elections"],
        ["/events", "Campus View"],
      ];
    }

    // 2. PRESIDENT (Executive Oversight)
    if (roles.includes("PRESIDENT")) {
      return [
        ["/manage", "Console"],
        ["/manage/events", "Events Console"],
        ["/manage/sponsorship", "Sponsorship"],
        ["/manage/claims", "Claims Review"],
        ["/manage/finance/ledger", "Ledger"],
        ["/manage/projects", "Projects"],
        ["/events", "Campus View"],
      ];
    }

    // 3. TREASURER (Finance & Accounts)
    if (roles.includes("TREASURER")) {
      return [
        ["/manage", "Console"],
        ["/manage/claims", "Claims Queue"],
        ["/manage/finance/ledger", "General Ledger"],
        ["/cash-desk", "Cash Desk"],
        ["/manage/memberships", "Dues Collection"],
        ["/manage/budget", "Budgets"],
        ["/events", "Campus View"],
      ];
    }

    // 4. EVENT_HEAD (Event Operations & Ticketing)
    if (roles.includes("EVENT_HEAD")) {
      return [
        ["/manage/events", "Event Console"],
        ["/manage/events/new", "Propose Event"],
        ["/events", "Public Events"],
        ["/calendar", "Calendar"],
        ["/volunteer", "Door Duties"],
        ["/shop", "Shop"],
      ];
    }

    // 5. SPONSORSHIP_HEAD (Odoo CRM & Corporate Partnerships)
    if (roles.includes("SPONSORSHIP_HEAD")) {
      return [
        ["/manage/sponsorship", "Sponsorship CRM"],
        ["/events", "Approved Events"],
        ["/calendar", "Calendar"],
        ["/shop", "Shop"],
        ["/announcements", "Updates"],
      ];
    }

    // 6. VOLUNTEER_HEAD (Volunteers & Project Tasks)
    if (roles.includes("VOLUNTEER_HEAD")) {
      return [
        ["/manage", "Console"],
        ["/manage/projects", "Projects & Tasks"],
        ["/volunteer", "Volunteer Space"],
        ["/events", "Events"],
        ["/calendar", "Calendar"],
      ];
    }

    // 7. MARKETING_HEAD (Merch, Campaigns & Bulletins)
    if (roles.includes("MARKETING_HEAD")) {
      return [
        ["/manage", "Console"],
        ["/manage/orders", "Fulfilment"],
        ["/manage/newsletter", "Newsletter"],
        ["/announcements", "Announcements"],
        ["/shop", "Shop"],
        ["/events", "Events"],
      ];
    }

    // 8. VOLUNTEER (Event Door & Operational Crew)
    if (isVolunteer) {
      return [
        ["/volunteer", "My Duties"],
        ["/volunteer/claims/new", "Submit Claim"],
        ["/events", "Events"],
        ["/calendar", "Calendar"],
        ["/me/tickets", "My Passes"],
        ["/shop", "Shop"],
      ];
    }

    // 9. Standard Student / Member
    return [
      ["/", "Home"],
      ["/events", "Events"],
      ["/calendar", "Calendar"],
      ["/shop", "Shop"],
      ["/me/tickets", "My Passes"],
      ["/announcements", "Updates"],
      ["/selection", "Apply"],
    ];
  }, [user]);

  const section = location.pathname.startsWith("/manage") && isLeadership
    ? {
        label: "Manage Skyline",
        icon: BriefcaseBusiness,
        links: filteredManageNav,
      }
    : location.pathname.startsWith("/volunteer") && (user?.isVolunteer || isLeadership)
      ? {
          label: "Volunteer space",
          icon: HeartHandshake,
          links: volunteerNavigation,
        }
      : null;
  const SectionIcon = section?.icon;
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const accountLinks = [
    ["/me", "My account"],
    ["/me/membership", "Membership card"],
    ["/me/tickets", "My tickets"],
    ["/me/orders", "My orders"],
    ["/me/notifications", "Notifications"],
  ];

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
  });
  const unreadNotificationsCount = (notificationsData?.data || []).filter(n => !n.readAt).length;

  if (user?.isVolunteer || (user?.roles?.length && !user.roles.includes("MENTOR")))
    accountLinks.push(["/volunteer", "Volunteer portal"]);
  if (
    user?.roles?.some((role) =>
      [
        "PRESIDENT",
        "TREASURER",
        "EVENT_HEAD",
        "VOLUNTEER_HEAD",
        "MARKETING_HEAD",
        "SPONSORSHIP_HEAD",
        "MENTOR",
      ].includes(role),
    )
  )
    accountLinks.push(["/manage", "Manage Skyline"]);

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Logout failed");
      queryClient.clear();
      queryClient.setQueryData(["auth", "me"], { data: null });
      setOpen(false);
      navigate("/");
      toast.success("You have been logged out.");
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const sessionActions = isPending ? (
    <span
      className="h-10 w-24 animate-pulse rounded-md bg-secondary"
      aria-label="Loading account"
    />
  ) : isError ? (
    <Button variant="outline" onClick={() => refetch()}>
      Retry account
    </Button>
  ) : user ? (
    <div className="flex items-center gap-2">
      {isLeadership && (
        <Button
          asChild
          size="sm"
          variant={location.pathname.startsWith("/manage") ? "default" : "outline"}
          className={cn(
            "hidden sm:inline-flex gap-1.5 font-semibold transition shadow-xs",
            location.pathname.startsWith("/manage")
              ? "bg-primary text-primary-foreground"
              : "border-primary/40 text-primary hover:bg-primary/10"
          )}
        >
          <Link to="/manage">
            <BriefcaseBusiness className="size-3.5" />
            <span>Console</span>
          </Link>
        </Button>
      )}
      {user.isVolunteer && !isLeadership && (
        <Button
          asChild
          size="sm"
          variant={location.pathname.startsWith("/volunteer") ? "default" : "outline"}
          className="hidden sm:inline-flex gap-1.5 font-medium"
        >
          <Link to="/volunteer">
            <HeartHandshake className="size-3.5 text-primary" />
            <span>Volunteer Space</span>
          </Link>
        </Button>
      )}
      <Link
        to="/me/notifications"
        aria-label="View notifications"
        className="relative inline-flex size-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-primary"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
          </span>
        )}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 max-w-48">
            <UserRound aria-hidden="true" />
            <span className="truncate">
              {user.name || "Account"}
            </span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">
            {user.name || "Your account"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {accountLinks.map(([to, label]) => (
            <DropdownMenuItem key={to} asChild>
              <Link to={to}>{label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={loggingOut} onSelect={logout}>
            <LogOut aria-hidden="true" />
            {loggingOut ? "Logging out…" : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <>
      <Button asChild variant="ghost" className="h-10">
        <Link to="/login">Log in</Link>
      </Button>
      <Button asChild className="h-10">
        <Link to="/join">
          Join Skyline <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
    </>
  );

  return (
    <div className="discovery-shell flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="page-container flex h-20 items-center justify-between gap-6">
          <Brand />
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {primaryNavigation.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {sessionActions}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[min(88vw,360px)] overflow-y-auto">
              <SheetHeader className="px-6 pt-7">
                <SheetTitle className="text-xl">Explore Skyline</SheetTitle>
                <SheetDescription>Your campus, connected.</SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1 px-4"
              >
                {primaryNavigation.map(([to, label]) => (
                  <NavLink
                    end={to === "/"}
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-3 text-base font-medium",
                        isActive
                          ? "bg-secondary text-primary"
                          : "hover:bg-secondary",
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="mx-6 border-t border-border" />
              <div className="flex flex-col gap-2 px-6 pb-6">
                {user ? (
                  <>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {user.name}
                    </p>
                    {accountLinks.map(([to, label]) => (
                      <Link
                        key={to}
                        to={to}
                        className="rounded-md py-2.5 text-sm font-medium"
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                    <Button
                      variant="outline"
                      disabled={loggingOut}
                      onClick={logout}
                    >
                      {loggingOut ? "Logging out…" : "Log out"}
                    </Button>
                  </>
                ) : (
                  sessionActions
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {section ? (
        <nav
          aria-label={`${section.label} navigation`}
          className="border-b border-border bg-[#272747] text-white"
        >
          <div className="page-container flex h-12 items-center gap-2 overflow-x-auto">
            <span className="mr-2 flex shrink-0 items-center gap-2 text-xs font-semibold text-[#c6c3f3]">
              <SectionIcon className="size-4" aria-hidden="true" />
              {section.label}
            </span>
            {section.links.map(([to, label]) => {
              const active =
                to === "/manage" || to === "/volunteer"
                  ? location.pathname === to
                  : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-white text-[#272747]"
                      : "text-[#d2d2e2] hover:bg-white/10 hover:text-white",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card">
        <div className="page-container flex flex-col justify-between gap-6 py-9 sm:flex-row sm:items-center">
          <div>
            <Brand />
            <p className="mt-3 text-sm text-muted-foreground">
              A little more campus. A lot more possibility.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            <Link to="/events" className="hover:text-primary">
              Explore events
            </Link>
            <Link to="/join" className="hover:text-primary">
              Membership
            </Link>
            <Link to="/announcements" className="hover:text-primary">
              Latest updates
            </Link>
          </nav>
        </div>
        <div className="page-container border-t border-border py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Skyline Student Association
        </div>
      </footer>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
