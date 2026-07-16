"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LeaveForm } from "@/components/leaves/LeaveForm";

export function ApplyLeaveButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
          <Calendar className="mr-2 h-4 w-4" />
          Apply for Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Submit your leave request for approval.
          </DialogDescription>
        </DialogHeader>
        <LeaveForm />
      </DialogContent>
    </Dialog>
  );
}
