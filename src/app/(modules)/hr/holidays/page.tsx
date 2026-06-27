import { getHolidaysAction } from "@/actions/holiday.actions";
import { getUserProfileAction } from "@/actions/auth.actions";
import { HolidayManager } from "@/components/modules/HolidayManager";

export default async function HolidaysPage() {
  const { data: holidays, success } = await getHolidaysAction();
  const profile: any = await getUserProfileAction();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'hr';

  if (!success) {
    return <div className="p-8 text-center text-muted-foreground">Failed to load holidays.</div>;
  }

  return (
    <div className="w-full">
      <HolidayManager initialHolidays={holidays || []} isAdmin={isAdmin} />
    </div>
  );
}
