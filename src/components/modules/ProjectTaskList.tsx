"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createTaskAction, updateTaskStatusAction } from "@/actions/task.actions";
import { CheckCircle2, Clock, PlayCircle, Plus, AlertCircle, LucideLoader2, Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  assigned_to: string;
  assigned_name: string;
  status: string;
  due_date: string;
  stage: string;
}

interface ProjectTaskListProps {
  projectId: string;
  currentStage: string;
  tasks: Task[];
  teamMembers: { id: string, name: string }[];
  currentUserId: string;
  isAdmin: boolean;
}

export function ProjectTaskList({ 
  projectId, 
  currentStage, 
  tasks, 
  teamMembers, 
  currentUserId, 
  isAdmin 
}: ProjectTaskListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const stageTasks = tasks.filter((t: any) => t.stage === currentStage);

  const handleCreateTask = () => {
    if (!newTaskTitle || !newTaskAssignee || !newTaskDueDate) return;

    startTransition(async () => {
      const result = await createTaskAction(
        projectId, 
        newTaskAssignee, 
        currentStage, 
        newTaskTitle, 
        newTaskDueDate
      );

      if (result?.success) {
        toast({ title: "Task Created", variant: "success" });
        setIsDialogOpen(false);
        setNewTaskTitle("");
        setNewTaskAssignee("");
        setNewTaskDueDate("");
      } else {
        toast({ title: "Error", description: result?.error || undefined, variant: "error" });
      }
    });
  };

  const handleUpdateStatus = (taskId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, newStatus, projectId);
      if (result?.success) {
        toast({ title: "Status Updated", variant: "success" });
      } else {
        toast({ title: "Error", description: result?.error || undefined, variant: "error" });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "rejected": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">Stage Tasks</h2>
          <Badge variant="secondary" className="capitalize">{currentStage.replace('_', ' ')}</Badge>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {stageTasks.length === 0 ? (
          <Card className="enterprise-card py-12 flex flex-col items-center justify-center border-dashed">
            <div className="text-muted-foreground text-sm">No tasks defined for this stage.</div>
          </Card>
        ) : (
          stageTasks.map((task) => (
            <Card key={task.id} className="enterprise-card hover:border-primary/20 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                    {getStatusIcon(task.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-gray-600">Assigned: {task.assigned_name}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {task.due_date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={task.status === "completed" ? "success" : "glass"} className="capitalize">
                    {task.status.replace('_', ' ')}
                  </Badge>

                  {(isAdmin || currentUserId === task.assigned_to) && task.status !== "completed" && (
                    <div className="flex items-center gap-1">
                      {task.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(task.id, "in_progress")} disabled={isPending}>
                          Start
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleUpdateStatus(task.id, "completed")} disabled={isPending}>
                          Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Assign a specific task for the {currentStage.replace('_', ' ')} stage.</DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Title</label>
              <Input 
                placeholder="e.g., Finalize Topography Map" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <Select 
                placeholder="Select team member..." 
                value={newTaskAssignee} 
                onValueChange={setNewTaskAssignee}
              >
                {teamMembers.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input 
                type="date" 
                value={newTaskDueDate} 
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isPending || !newTaskTitle || !newTaskAssignee || !newTaskDueDate}>
              {isPending ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
