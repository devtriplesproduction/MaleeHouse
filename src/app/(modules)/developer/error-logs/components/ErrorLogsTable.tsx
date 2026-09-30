'use client';

import { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Eye, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  Globe, 
  Clock, 
  User, 
  Terminal,
  Activity,
  X
} from 'lucide-react';
import { toggleErrorResolvedAction } from '@/actions/admin.actions';
import { toast } from 'sonner';
import { KPICard } from '@/components/modules/KPICard';

interface ErrorLogItem {
  id: string;
  message: string;
  stack_trace?: string | null;
  module: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  path: string;
  resolved: boolean;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  } | null;
}

export default function ErrorLogsTable({ initialData }: { initialData: ErrorLogItem[] }) {
  const [data, setData] = useState<ErrorLogItem[]>(initialData);
  const [selectedLog, setSelectedLog] = useState<ErrorLogItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleToggleResolved = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleErrorResolvedAction(id, !currentStatus);
      if (res.success) {
        setData(prev => prev.map(log => log.id === id ? { ...log, resolved: !currentStatus } : log));
        if (selectedLog && selectedLog.id === id) {
          setSelectedLog(prev => prev ? { ...prev, resolved: !currentStatus } : null);
        }
        toast.success(`Error marked as ${!currentStatus ? 'Resolved' : 'Unresolved'}`);
      } else {
        toast.error('Failed to update status');
      }
    });
  };

  const filteredData = useMemo(() => {
    return data.filter(log => {
      if (statusFilter === 'unresolved' && log.resolved) return false;
      if (statusFilter === 'resolved' && !log.resolved) return false;
      if (severityFilter !== 'all' && log.severity?.toUpperCase() !== severityFilter.toUpperCase()) return false;
      
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchMsg = log.message?.toLowerCase().includes(query);
        const matchPath = log.path?.toLowerCase().includes(query);
        const matchModule = log.module?.toLowerCase().includes(query);
        const matchUser = log.user_id?.toLowerCase().includes(query) || 
          `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.toLowerCase().includes(query);
        if (!matchMsg && !matchPath && !matchModule && !matchUser) return false;
      }
      return true;
    });
  }, [data, search, statusFilter, severityFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = data.length;
    const unresolved = data.filter(d => !d.resolved).length;
    const criticalOrHigh = data.filter(d => !d.resolved && (d.severity === 'CRITICAL' || d.severity === 'HIGH')).length;
    const resolved = data.filter(d => d.resolved).length;
    return { total, unresolved, criticalOrHigh, resolved };
  }, [data]);

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800">
            <Info className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Summary KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Logged"
          value={stats.total}
          icon={Activity}
          color="text-indigo-600 dark:text-indigo-400"
          bg="bg-indigo-500/10"
        />
        <KPICard
          label="Critical / High"
          value={stats.criticalOrHigh}
          icon={ShieldAlert}
          color="text-red-600 dark:text-red-400"
          bg="bg-red-500/10"
        />
        <KPICard
          label="Unresolved"
          value={stats.unresolved}
          icon={AlertOctagon}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <KPICard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <Card className="p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box - Non-overlapping Icon & Input */}
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-muted-foreground pointer-events-none z-10" />
            <Input 
              placeholder="Search message, module, or path..." 
              className="pl-10 pr-8 bg-background h-9 text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Pills */}
            <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({data.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unresolved')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'unresolved' ? 'bg-background shadow-xs text-orange-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Open ({stats.unresolved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'resolved' ? 'bg-background shadow-xs text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Resolved ({stats.resolved})
              </button>
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {(search || statusFilter !== 'all' || severityFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearch(''); setStatusFilter('all'); setSeverityFilter('all'); }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Error Logs Table ───────────────────────────────────────────── */}
      <Card className="shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider">Timestamp</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider">Severity</TableHead>
                <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider">Module & Path</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Error Summary</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-[100px] text-right text-xs font-semibold uppercase tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((log) => (
                <TableRow 
                  key={log.id} 
                  className={`transition-colors cursor-pointer group hover:bg-muted/50 ${log.resolved ? 'opacity-55 hover:opacity-100 bg-muted/20' : ''}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    <div className="font-medium text-foreground">
                      {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 inline" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(log.severity)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0">
                        {log.module || 'System'}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground truncate max-w-[200px] mt-1" title={log.path}>
                      {log.path || '/'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground line-clamp-2 max-w-xl font-mono text-xs bg-muted/40 p-1.5 rounded border border-muted" title={log.message}>
                      {log.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleResolved(log.id, log.resolved);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
                        log.resolved 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      {log.resolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Resolved
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="w-3.5 h-3.5 text-orange-600" />
                          Open
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs font-medium gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-foreground mt-2">No Error Logs Found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search || statusFilter !== 'all' || severityFilter !== 'all' 
                          ? 'No errors match your current search and filter settings.'
                          : 'All systems are operating smoothly without logged runtime exceptions.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Redesigned Error Details Dialog ────────────────────── */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border shadow-2xl bg-card">
          {/* Header Banner */}
          <div className="px-6 py-5 border-b bg-muted/20 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Diagnostic Error Inspection
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground pl-10">
                Detailed stack trace and execution context captured for this exception.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 pr-6">
              {selectedLog && getSeverityBadge(selectedLog.severity)}
              <Badge 
                variant="outline" 
                className={`text-xs font-semibold px-2.5 py-0.5 ${
                  selectedLog?.resolved 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}
              >
                {selectedLog?.resolved ? 'RESOLVED' : 'UNRESOLVED'}
              </Badge>
            </div>
          </div>

          {/* Scrollable Content Body */}
          {selectedLog && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Error Message Card */}
              <div className="rounded-xl border border-red-200 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900/40 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-red-200/60 dark:border-red-900/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    Error Message
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-700 hover:bg-red-100 hover:text-red-900 gap-1"
                    onClick={() => handleCopy(selectedLog.message, 'msg')}
                  >
                    {copiedKey === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'msg' ? 'Copied' : 'Copy Message'}
                  </Button>
                </div>
                <div className="mt-2.5 font-mono text-xs md:text-sm text-red-950 dark:text-red-200 leading-relaxed break-words selection:bg-red-200">
                  {selectedLog.message}
                </div>
              </div>

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Module
                  </span>
                  <span className="font-semibold text-sm text-foreground mt-1 truncate">
                    {selectedLog.module || 'System'}
                  </span>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-primary" />
                    Path / Route
                  </span>
                  <span className="font-mono text-xs text-foreground mt-1 truncate font-medium" title={selectedLog.path}>
                    {selectedLog.path || 'N/A'}
                  </span>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Triggered By
                  </span>
                  <span className="font-medium text-xs text-foreground mt-1 truncate">
                    {selectedLog.profiles ? `${selectedLog.profiles.first_name || ''} ${selectedLog.profiles.last_name || ''}`.trim() : (selectedLog.user_id ? 'Authenticated User' : 'Anonymous / System')}
                  </span>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Occurred At
                  </span>
                  <span className="font-medium text-xs text-foreground mt-1 truncate" title={selectedLog.created_at}>
                    {format(new Date(selectedLog.created_at), 'dd MMM, HH:mm:ss')}
                  </span>
                </div>
              </div>

              {/* Stack Trace Terminal Window */}
              {selectedLog.stack_trace ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
                  {/* Terminal Header */}
                  <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 ml-2 font-medium flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-slate-400" />
                        Stack Trace
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 gap-1.5"
                      onClick={() => handleCopy(selectedLog.stack_trace || '', 'stack')}
                    >
                      {copiedKey === 'stack' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'stack' ? 'Copied' : 'Copy Trace'}
                    </Button>
                  </div>

                  {/* Terminal Code Output */}
                  <div className="p-4 max-h-72 overflow-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-slate-700">
                    {selectedLog.stack_trace}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                  No stack trace was captured for this exception.
                </div>
              )}

              {/* Client Network Environment Card */}
              <div className="rounded-lg border bg-muted/20 p-3.5 space-y-2 text-xs">
                <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Client & Request Context
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">IP Address:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{selectedLog.ip_address || 'Unknown'}</code>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-foreground whitespace-nowrap">User Agent:</span>
                    <span className="truncate text-foreground text-[11px]" title={selectedLog.user_agent || 'Unknown'}>
                      {selectedLog.user_agent || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dialog Action Footer */}
          {selectedLog && (
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const jsonStr = JSON.stringify(selectedLog, null, 2);
                  handleCopy(jsonStr, 'full_json');
                }}
              >
                {copiedKey === 'full_json' ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copiedKey === 'full_json' ? 'JSON Copied' : 'Export Full Log JSON'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </Button>

                <Button
                  variant={selectedLog.resolved ? "outline" : "primary"}
                  size="sm"
                  onClick={() => handleToggleResolved(selectedLog.id, selectedLog.resolved)}
                  disabled={isPending}
                  className={`gap-1.5 font-medium ${
                    !selectedLog.resolved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedLog.resolved ? 'Reopen Issue' : 'Mark as Resolved'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
