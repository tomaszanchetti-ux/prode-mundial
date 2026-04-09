import { MatchDetailScreen } from "@/components/matches/match-detail-screen";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;

  return <MatchDetailScreen matchId={matchId} />;
}
