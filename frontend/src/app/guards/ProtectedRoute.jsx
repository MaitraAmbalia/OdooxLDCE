import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { getDefaultLandingPath, isLeadershipUser } from "@/lib/access";

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireLeadership = false,
  requireVolunteer = false,
  requireMember = false,
  anyPermission = null,
  allPermissions = null,
  fallbackPath = null,
  unauthorizedMessage = null,
}) {
  const { data, isPending } = useSession();
  const user = data?.data;
  const location = useLocation();

  const isLeadership = isLeadershipUser(user);
  const isVolunteer = Boolean(user?.isVolunteer || isLeadership);
  const isMember = user?.membership?.status === "ACTIVE";
  const userPermissions = user?.permissions || [];

  // Determine authorization status
  let authorized = true;
  let defaultFallback = getDefaultLandingPath(user);
  let defaultMsg = "You do not have permission to view that section.";

  if (requireAuth && !user) {
    authorized = false;
  } else if (requireLeadership && !isLeadership) {
    authorized = false;
    defaultFallback = "/me";
    defaultMsg = "Leadership access is required for this area.";
  } else if (requireVolunteer && !isVolunteer) {
    authorized = false;
    defaultFallback = "/me";
    defaultMsg = "Volunteer portal access is required.";
  } else if (requireMember && !isMember) {
    authorized = false;
    defaultFallback = "/join";
    defaultMsg = "Active membership is required.";
  } else if (anyPermission && anyPermission.length > 0) {
    const hasAny = anyPermission.some((perm) => userPermissions.includes(perm));
    if (!hasAny) {
      authorized = false;
    }
  } else if (allPermissions && allPermissions.length > 0) {
    const hasAll = allPermissions.every((perm) => userPermissions.includes(perm));
    if (!hasAll) {
      authorized = false;
    }
  }

  const redirectDest = !user
    ? `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
    : (fallbackPath || defaultFallback);

  const messageToShow = unauthorizedMessage || defaultMsg;

  useEffect(() => {
    if (!isPending && user && !authorized) {
      toast.error(messageToShow);
    }
  }, [isPending, user, authorized, messageToShow]);

  if (isPending) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to={redirectDest} replace />;
  }

  return children;
}
