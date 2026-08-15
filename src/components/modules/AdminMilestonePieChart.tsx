'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectBillingTable, ProjectBillingSummary } from '@/features/accounts/ProjectBillingTable';
import { getProjectBillingSummaryAction } from '@/actions/finance.actions';

export interface MilestoneAggregateData {
  name: string;
  value: number;
  projectIds?: string[];
}

interface AdminMilestonePieChartProps {
  data: MilestoneAggregateData[];
}

const COLORS = [
  '#6366f1', // Indigo 500
  '#f59e0b', // Amber 500
  '#10b981', // Emerald 500
  '#ec4899', // Pink 500
  '#8b5cf6', // Violet 500
  '#0ea5e9', // Sky 500
  '#ef4444', // Red 500
  '#14b8a6', // Teal 500
  '#f97316', // Orange 500
  '#64748b', // Slate 500
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-lg">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
          {data.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Projects waiting for payment: <span className="font-bold text-slate-900 dark:text-white">{data.value}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1">Click to view projects</p>
      </div>
    );
  }
  return null;
};

export function AdminMilestonePieChart({ data }: AdminMilestonePieChartProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMilestoneName, setSelectedMilestoneName] = useState<string>('');
  const [selectedProjectCount, setSelectedProjectCount] = useState<number>(0);
  const [projectsData, setProjectsData] = useState<ProjectBillingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // If all values are 0, we can show an empty state or let recharts render an empty chart
  const hasData = data.some(item => item.value > 0);

  const handleSliceClick = async (entry: any) => {
    const dataObj = entry.payload || entry;
    if (!dataObj.projectIds || dataObj.projectIds.length === 0) return;
    
    setSelectedMilestoneName(dataObj.name);
    setSelectedProjectCount(dataObj.value);
    setProjectsData([]);
    setModalOpen(true);
    setIsLoading(true);

    try {
      const response = await getProjectBillingSummaryAction(dataObj.projectIds);
      if (response.success && response.data) {
        setProjectsData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch project summaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="col-span-1 border-slate-200/60 dark:border-white/5 shadow-xs bg-white dark:bg-slate-950/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
              Pending Milestone Payments
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Projects waiting for payment release across milestones (up to 10)
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          {!hasData ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
              No pending milestone payments found.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                    animationEasing="ease-out"
                    onClick={(entry) => handleSliceClick(entry)}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-sm"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div className="flex flex-col">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-500" />
                {selectedMilestoneName} — Payment Pending
              </DialogTitle>
              <span className="text-sm text-slate-500 mt-1">
                {selectedProjectCount} {selectedProjectCount === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20 thin-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p className="text-sm">Loading project details...</p>
              </div>
            ) : projectsData.length > 0 ? (
              <ProjectBillingTable projects={projectsData} />
            ) : (
              <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
                No project details found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
