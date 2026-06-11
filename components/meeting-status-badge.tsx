import type { MeetingStatus } from "@/lib/types";

const STYLES: Record<MeetingStatus, { label: string; cls: string }> = {
  booked: { label: "En attente", cls: "border-night-500 text-foreground/50" },
  validated: { label: "Validé", cls: "border-ice-500/30 text-ice-300" },
  no_show: { label: "No-show", cls: "border-ember-500/30 text-ember-400" },
  disputed: { label: "Contesté", cls: "border-ember-500/30 text-ember-400" },
  cancelled: { label: "Annulé", cls: "border-night-600 text-foreground/30" },
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const s = STYLES[status];
  return (
    <span className={`micro inline-flex rounded-full border px-2.5 py-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}
