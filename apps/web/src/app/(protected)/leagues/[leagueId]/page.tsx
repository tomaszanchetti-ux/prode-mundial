import { redirect } from "next/navigation";

export default async function LeagueDetailPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  redirect(`/leagues?leagueId=${leagueId}`);
}
