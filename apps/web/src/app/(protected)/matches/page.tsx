import { redirect } from "next/navigation";
import { APP_ROUTES } from "@prode/shared";

export default function MatchesPage() {
  redirect(APP_ROUTES.tournament);
}
