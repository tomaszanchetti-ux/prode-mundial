import { redirect } from "next/navigation";
import { APP_ROUTES } from "@prode/shared";

export default function MacroPicksPage() {
  redirect(APP_ROUTES.picks);
}
