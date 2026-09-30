'use client';

import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { Select, SelectItem } from '@/components/ui/select';
import { getMonthlyProjectCreationTrendAction } from '@/actions/admin.actions';
import { cn } from '@/lib/utils';

interface TrendMonth {
  name: string;
  current: number;
  previous: number;
  changePercent: number;
}

interface TrendSummary {
  total: number;
  bestMonth: { name: string; count: number };
  average: number;
  lowestMonth: { name: string; count: number };
}

interface TrendData {
  currentYear: number;
  previousYear: number;
  months: TrendMonth[];
  summary: TrendSummary;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length >= 2) {
    const current = payload.find((p: any) => p.dataKey === 'current')?.payload;
    if (!current) return null;

    const isPositive = current.changePercent >= 0;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-lg min-w-[160px]">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-white/5 pb-1">
          {label}
        </p>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">Current Year:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{current.current}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500">Previous Year:</span>
          <span className="font-bold text-slate-600 dark:text-slate-400">{current.previous}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-white/5">
          <span className="text-[10px] text-slate-400">Change</span>
          <span className={cn(
            "text-xs font-bold",
            isPositive ? "text-emerald-500" : "text-rose-500"
          )}>
            {isPositive ? '+' : ''}{current.changePercent}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const TriangleBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const depth = width * 0.4;
  
  if (height === 0 || isNaN(height)) return null;

  return (
    <g>
      {/* Front face */}
      <rect x={x} y={y} width={width} height={height} fill="url(#frontGradient)" />
      {/* Right side face */}
      <path d={`M${x + width},${y} L${x + width + depth},${y - depth} L${x + width + depth},${y + height - depth} L${x + width},${y + height} Z`} fill="url(#sideGradient)" />
      {/* Top face */}
      <path d={`M${x},${y} L${x + depth},${y - depth} L${x + width + depth},${y - depth} L${x + width},${y} Z`} fill="url(#topGradient)" />
    </g>
  );
};

export function AdminProjectTrendChart() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate years for dropdown (e.g., from 2023 to current year + 1)
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 3 + i).toString());

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await getMonthlyProjectCreationTrendAction(parseInt(selectedYear));
        if (isMounted && response.success && response.data) {
          setData(response.data as TrendData);
        }
      } catch (error) {
        console.error('Failed to fetch trend data', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [selectedYear]);

  const renderSummaryCard = (label: string, value: string | number, subtext?: string) => (
    <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/5 rounded-xl p-3 flex flex-col justify-center">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{value}</div>
      {subtext && <div className="text-[10px] text-slate-400 mt-0.5">{subtext}</div>}
    </div>
  );

  return (
    <Card className="col-span-full border-slate-200/60 dark:border-white/5 shadow-xs bg-white dark:bg-slate-950/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Project Creation Trend
          </CardTitle>
          <CardDescription className="text-xs font-medium mt-0.5">
            New projects created each month
          </CardDescription>
        </div>
        
        <div className="w-32 z-10">
          <Select 
            value={selectedYear} 
            onValueChange={setSelectedYear}
            placeholder="Select Year"
            buttonClassName="h-8 px-3 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="h-[380px] w-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-medium">Loading trend data...</p>
          </div>
        ) : !data ? (
          <div className="h-[380px] w-full flex items-center justify-center text-sm text-slate-500">
            Failed to load data.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderSummaryCard("Total Projects", data.summary.total, `in ${data.currentYear}`)}
              {renderSummaryCard("Best Month", data.summary.bestMonth.name, `${data.summary.bestMonth.count} projects`)}
              {renderSummaryCard("Avg / Month", data.summary.average, "projects")}
              {renderSummaryCard("Lowest Month", data.summary.lowestMonth.name, `${data.summary.lowestMonth.count} projects`)}
            </div>

            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.months} margin={{ top: 30, right: 30, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="frontGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6791b8" />
                      <stop offset="100%" stopColor="#436b8f" />
                    </linearGradient>
                    <linearGradient id="sideGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#436b8f" />
                      <stop offset="100%" stopColor="#254763" />
                    </linearGradient>
                    <linearGradient id="topGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#87b5db" />
                      <stop offset="100%" stopColor="#87b5db" />
                    </linearGradient>
                    
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#6791b8" />
                    </marker>
                  </defs>

                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-secondary)', opacity: 0.1 }} />
                  
                  <Line 
                    type="linear" 
                    dataKey="previous" 
                    stroke="#6791b8" 
                    strokeWidth={4}
                    dot={false}
                    activeDot={false}
                    markerEnd="url(#arrow)"
                    animationDuration={1000}
                  />

                  <Bar 
                    dataKey="current" 
                    shape={<TriangleBar />}
                    maxBarSize={40}
                    animationDuration={1000}
                  >
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
