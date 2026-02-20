import { auth } from "@/lib/auth";
import { getDeadlineStatus } from "@/lib/deadline";
import { Clock, AlertTriangle, Lock } from "lucide-react";

export async function DeadlineBanner() {
  const session = await auth();
  if (!session || session.user.role !== "student") return null;

  const status = await getDeadlineStatus(session.user.organizationId);
  if (!status.deadline) return null;

  if (status.isPast) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-destructive">
          <Lock className="h-4 w-4" />
          <span>
            The roommate selection deadline has passed. All rooms are now
            finalized.
          </span>
        </div>
      </div>
    );
  }

  if (status.isNear) {
    const hours = Math.round(status.hoursRemaining || 0);
    return (
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-6 dark:bg-amber-950/20 dark:border-amber-800">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Deadline approaching! Only <strong>{hours} hours</strong> remaining.
            {hours <= 6 && " Room changes are now restricted."}
          </span>
        </div>
      </div>
    );
  }

  const days = Math.ceil((status.hoursRemaining || 0) / 24);
  return (
    <div className="bg-muted/50 border-b py-2 px-6">
      <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Roommate selection deadline:{" "}
          <strong>
            {new Date(status.deadline).toLocaleDateString()} ({days} days left)
          </strong>
        </span>
      </div>
    </div>
  );
}
