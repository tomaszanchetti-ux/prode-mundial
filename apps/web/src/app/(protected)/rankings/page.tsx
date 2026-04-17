import { redirect } from "next/navigation";
import { APP_ROUTES } from "@prode/shared";

export default function RankingsPage() {
  redirect(APP_ROUTES.leagues);
}
