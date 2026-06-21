"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { updateTaskStatusAction } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectTasksSectionProps {
  projectId: string;
  tasks: any[];
}

export function ProjectTasksSection({ projectId, tasks }: ProjectTasksSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    setLoadingId(taskId);
    try {
      const result = await updateTaskStatusAction(taskId, newStatus, projectId);
      if (result?.success) {
        toast.success(`Task marked as ${newStatus}`);
      } else {
        toast.error(result?.error || "Failed to update task");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          Project Tasks & Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Title</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                  No tasks assigned to this project yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {task.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-3.5 h-3.5 opacity-50" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={task.status === 'completed' ? 'secondary' : 'glass'}
                      className={task.status === 'completed' ? 'bg-green-500/10 text-green-600' : ''}
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loadingId === task.id}
                        onClick={() => handleStatusUpdate(task.id, 'completed')}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        Mark Done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
