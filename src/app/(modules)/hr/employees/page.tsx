import { getAllUsersAction } from "@/actions/admin.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Calendar, Users } from "lucide-react";

export default async function EmployeeDirectoryPage() {
  const { data: users, success } = await getAllUsersAction();

  const getBirthdayStatus = (dobStr: string | null | undefined) => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    const dobMonth = dob.getMonth();
    const dobDate = dob.getDate();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    if (dobMonth === todayMonth && dobDate === todayDate) {
      return "Today";
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dobMonth === tomorrow.getMonth() && dobDate === tomorrow.getDate()) {
      return "Tomorrow";
    }
    
    // Check if it's upcoming in next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const dobThisYear = new Date(today.getFullYear(), dobMonth, dobDate);
    if (dobThisYear >= today && dobThisYear <= nextWeek) {
      return "Upcoming";
    }
    
    return null;
  };

  const sortedUsers = [...(users || [])].sort((a, b) => {
    if (!a.dob) return 1;
    if (!b.dob) return -1;
    const dateA = new Date(a.dob);
    const dateB = new Date(b.dob);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let nextA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
    if (nextA < today) nextA.setFullYear(today.getFullYear() + 1);
    
    let nextB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
    if (nextB < today) nextB.setFullYear(today.getFullYear() + 1);
    
    return nextA.getTime() - nextB.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">View and search through all personnel profiles and details.</p>
        </div>
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Personnel List
          </TabsTrigger>
          <TabsTrigger value="birthdays" className="flex items-center gap-2">
            <Gift className="w-4 h-4" /> Birthday Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <Card>
            <CardHeader>
              <CardTitle>Personnel List</CardTitle>
              <CardDescription>A complete list of all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {success && users ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell className="capitalize">{user.department || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status || 'Active'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">Failed to load employees.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="birthdays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" /> Employee Birthdays
              </CardTitle>
              <CardDescription>A complete list of all employee birthdates, sorted by upcoming dates.</CardDescription>
            </CardHeader>
            <CardContent>
              {success && sortedUsers ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user: any) => {
                      const status = getBirthdayStatus(user.dob);
                      return (
                        <TableRow key={`bday-${user.id}`}>
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell className="capitalize">{user.department || 'N/A'}</TableCell>
                          <TableCell>
                            {user.dob ? (
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {new Date(user.dob).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Not provided</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {status === "Today" && <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-transparent">🎂 Today</Badge>}
                            {status === "Tomorrow" && <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-transparent">🎈 Tomorrow</Badge>}
                            {status === "Upcoming" && <Badge variant="outline" className="border-indigo-200 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-400">Upcoming</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">Failed to load employees.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
