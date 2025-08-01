import { getDrawsAwaitingWinner } from "./actions";
import AnnouncementsClientPage from "./AnnouncementsClientPage";

export default async function AnnouncementsPage() {
  const draws = await getDrawsAwaitingWinner();

  return <AnnouncementsClientPage draws={draws} />;
}
