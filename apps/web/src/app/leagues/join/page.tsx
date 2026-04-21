import { Suspense } from "react";
import { LeagueInviteScreen } from "@/components/leagues/league-invite-screen";

export default function LeagueInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-[980px] mx-auto px-4 pt-6 pb-14 text-text-secondary">
          Cargando invitacion...
        </main>
      }
    >
      <LeagueInviteScreen />
    </Suspense>
  );
}
