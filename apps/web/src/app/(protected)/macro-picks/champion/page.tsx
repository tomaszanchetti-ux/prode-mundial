import { redirect } from "next/navigation";
import { APP_ROUTES } from "@prode/shared";

export default function MacroPicksChampionPage() {
  redirect(`${APP_ROUTES.picks}?tab=champion`);
}
