import { redirect } from "next/navigation";
import { APP_ROUTES } from "@prode/shared";

export default function MacroPicksSubChampionPage() {
  redirect(`${APP_ROUTES.picks}?tab=sub-champion`);
}
