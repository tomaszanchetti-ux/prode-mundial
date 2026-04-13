import { Suspense } from "react";
import { colors } from "@prode/ui";
import { LeagueInviteScreen } from "@/components/leagues/league-invite-screen";

export default function LeagueInvitePage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 56px", color: colors.textSecondary }}>
          Cargando invitacion...
        </main>
      }
    >
      <LeagueInviteScreen />
    </Suspense>
  );
}
