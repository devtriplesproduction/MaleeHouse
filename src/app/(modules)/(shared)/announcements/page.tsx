import { getAnnouncementsAction } from "@/actions/announcement.actions";
import { getUserProfileAction } from "@/actions/auth.actions";
import { AnnouncementManager } from "@/components/modules/AnnouncementManager";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Announcements | Malee House',
  description: 'View company announcements and updates.',
};

export default async function AnnouncementsPage() {
  const profile = await getUserProfileAction();
  if (!profile) redirect('/login');

  const { data: announcements, success } = await getAnnouncementsAction();

  // Filter announcements for non-managers
  const isManager = profile.role === 'admin' || profile.role === 'hr';
  
  let visibleAnnouncements = [];
  if (success && announcements) {
    if (isManager) {
      visibleAnnouncements = announcements;
    } else {
      visibleAnnouncements = announcements.filter((ann: any) => 
        ann.target_roles.includes('*') || ann.target_roles.includes(profile.role)
      );
    }
  }

  return (
    <div className="pb-20">
      <AnnouncementManager 
        announcements={visibleAnnouncements} 
        currentUserRole={profile.role} 
      />
    </div>
  );
}
