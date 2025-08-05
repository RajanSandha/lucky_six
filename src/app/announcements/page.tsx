
import { getAllAnnouncements } from "./actions";
import AnnouncementsClientPage from "./AnnouncementsClientPage";

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const draws = await getAllAnnouncements();

  return <AnnouncementsClientPage draws={draws} />;
}
