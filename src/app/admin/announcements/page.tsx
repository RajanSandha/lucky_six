
import { getAllAnnouncements } from "./actions";
import AnnouncementsClientPage from "./AnnouncementsClientPage";

export default async function AnnouncementsPage() {
  const draws = await getAllAnnouncements();

  return <AnnouncementsClientPage draws={draws} />;
}
