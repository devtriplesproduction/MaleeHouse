"use client";

import { useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createHolidayAction, updateHolidayAction, deleteHolidayAction } from "@/actions/holiday.actions";
import { cn } from "@/lib/utils";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";

interface Holiday {
  id: string;
  date: string;
  name: string;
  is_optional: boolean;
  created_at?: string;
}

export function HolidayManager({ initialHolidays, isAdmin }: { initialHolidays: Holiday[], isAdmin: boolean }) {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isOptional, setIsOptional] = useState(false);

  // Group holidays by month for the selected year
  const months = useMemo(() => {
    const m = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: new Date(currentYear, i).toLocaleString('default', { month: 'long' }),
      holidays: [] as Holiday[]
    }));
    
    holidays.forEach(h => {
      const hDate = new Date(h.date);
      if (hDate.getFullYear() === currentYear) {
        m[hDate.getMonth()].holidays.push(h);
      }
    });
    
    // Sort holidays within each month
    m.forEach(month => {
      month.holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return m;
  }, [holidays, currentYear]);

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setDate(undefined);
    setIsOptional(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setName(holiday.name);
    setDate(new Date(holiday.date));
    setIsOptional(holiday.is_optional);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      toast.error("Please provide a name and date.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      date: date.toISOString(), // Standard format for DB
      is_optional: false
    };

    try {
      if (editingId) {
        const res = await updateHolidayAction(editingId, payload);
        if (res.success && res.data) {
          toast.success("Holiday updated successfully!");
          setHolidays(prev => prev.map(h => h.id === editingId ? res.data : h));
          setIsOpen(false);
        } else {
          toast.error(res.error || "Failed to update holiday");
        }
      } else {
        const res = await createHolidayAction(payload);
        if (res.success && res.data) {
          toast.success("Holiday added successfully!");
          setHolidays(prev => [...prev, res.data]);
          setIsOpen(false);
        } else {
          toast.error(res.error || "Failed to add holiday");
        }
      }
    } catch (err: any) {
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    
    try {
      const res = await deleteHolidayAction(id);
      if (res.success) {
        toast.success("Holiday deleted");
        setHolidays(prev => prev.filter(h => h.id !== id));
      } else {
        toast.error(res.error || "Failed to delete holiday");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground font-sans">
              Holiday <span className="text-primary font-sans">Calendar</span>
            </h1>
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Manage public and optional holidays for the year.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-card rounded-xl ring-1 ring-border shadow-sm p-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y - 1)} className="rounded-lg h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 font-bold text-lg w-20 text-center">{currentYear}</div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y + 1)} className="rounded-lg h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {isAdmin && (
            <Button onClick={handleOpenNew} variant="primary" className="gap-2">
              <Plus className="w-4 h-4" /> Add Holiday
            </Button>
          )}
        </div>
      </div>

      {months.filter(m => m.holidays.length > 0).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.filter(m => m.holidays.length > 0).map(({ month, name, holidays }) => (
            <Card key={month} className="border-0 shadow-xl shadow-foreground/5 ring-1 ring-border rounded-[24px] overflow-hidden flex flex-col">
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-lg">{name}</h3>
                <Badge variant="outline" className="bg-background text-xs font-semibold rounded-full px-2.5">
                  {holidays.length}
                </Badge>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3 min-h-[120px]">
                {holidays.map(h => (
                  <div 
                    key={h.id} 
                    className="flex justify-between items-start p-3 rounded-xl border transition-all duration-200 group relative bg-primary/5 border-primary/20 shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-sm mb-0.5">{new Date(h.date).getDate()} {name}</div>
                      <div className="text-sm text-foreground/80 font-medium flex items-center gap-1.5">
                        🎉 {h.name}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                        Public Holiday
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-border">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleOpenEdit(h)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(h.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-card/50 rounded-[32px] border border-dashed border-border backdrop-blur-sm">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="w-10 h-10 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No Holidays Found for {currentYear}</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            It looks like no public or optional holidays have been added for this year yet.
          </p>
          {isAdmin && (
            <Button onClick={handleOpenNew} variant="outline" className="mt-6 gap-2">
              <Plus className="w-4 h-4" /> Add First Holiday
            </Button>
          )}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isSubmitting) setIsOpen(false);
      }}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-[24px] shadow-2xl border-0 bg-background">
          <div className="bg-muted/30 p-6 border-b border-border">
            <DialogHeader className="mb-1">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                  <CalendarIcon className="w-6 h-6 text-primary-foreground -rotate-3" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                    {editingId ? 'Edit Holiday' : 'Add Holiday'}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm mt-0.5">
                    {editingId ? 'Update the details below.' : 'Add a new public holiday.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground ml-1">Holiday Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="E.g., New Year's Day" 
                className="bg-muted/30 border-transparent focus:bg-background focus:border-primary focus-visible:ring-primary/20 text-sm py-6 px-4 rounded-xl shadow-sm transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground ml-1">Date</Label>
              <div className="w-full">
                <PremiumDatePicker 
                  value={date?.toISOString() || ''}
                  onChange={(d) => setDate(new Date(d))}
                />
              </div>
            </div>

            
            <div className="pt-3 sm:flex sm:justify-end gap-3 flex-col sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full sm:w-auto h-12 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Holiday')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
