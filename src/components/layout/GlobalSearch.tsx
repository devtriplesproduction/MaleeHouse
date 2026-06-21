"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, FileText, User, CheckSquare, Command, ArrowRight, History, Zap, Plus, UserPlus, Activity, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { globalSearchAction } from "@/actions/search.actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentItem {
  id: string;
  name: string;
  type: 'project' | 'user' | 'task';
  path: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ projects: any[], users: any[], tasks: any[] }>({
    projects: [],
    users: [],
    tasks: []
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const quickActions = [
    { title: "Create New Project", shortcut: "/new-project", icon: Plus, path: "/projects/new", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Invite Team Member", shortcut: "/invite", icon: UserPlus, path: "/admin/users", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "System Health Room", shortcut: "/health", icon: Activity, path: "/admin", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Security Audit Logs", shortcut: "/security", icon: ShieldAlert, path: "/admin", color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Analytics Overview", shortcut: "/stats", icon: Zap, path: "/admin", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const filteredQuickActions = query.startsWith("/") 
    ? quickActions.filter((a: any) => a.shortcut.includes(query.toLowerCase()))
    : [];

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Load recently viewed from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("triples_recently_viewed");
    if (saved) {
      try {
        setRecentItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recently viewed items");
      }
    }
  }, []);

  // Search logic with simple debouncing
  useEffect(() => {
    if (query.length < 2) {
      setResults({ projects: [], users: [], tasks: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const data = await globalSearchAction(query);
      setResults(data);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (item: RecentItem) => {
    // Update recently viewed
    const updated = [
      item,
      ...recentItems.filter((i: any) => i.id !== item.id)
    ].slice(0, 5);
    
    setRecentItems(updated);
    localStorage.setItem("triples_recently_viewed", JSON.stringify(updated));

    router.push(item.path);
    setOpen(false);
    setQuery("");
  };

  const hasResults = results.projects.length > 0 || results.users.length > 0 || results.tasks.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all w-full max-w-[240px] group shadow-sm"
      >
        <Search className="h-4 w-4 group-hover:text-indigo-500 transition-colors" />
        <span>Search anything...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl">
          <div className="flex items-center px-4 border-b border-slate-100 dark:border-white/5 h-14">
            <Search className="h-5 w-5 text-slate-400 dark:text-slate-600 mr-3" />
            <input
              autoFocus
              placeholder="Type / for actions or search projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 text-base font-medium"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {query.startsWith("/") && (
              <div className="p-2">
                <div className="px-2 mb-2 text-[11px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Command Shortcuts
                </div>
                <div className="space-y-1">
                  {filteredQuickActions.map((action) => (
                    <button
                      key={action.shortcut}
                      onClick={() => {
                        router.push(action.path);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 group transition-all"
                    >
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-colors", action.bg, action.color)}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{action.title}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{action.shortcut}</div>
                      </div>
                      <kbd className="hidden group-hover:inline-flex h-5 items-center gap-1 rounded border dark:border-white/10 bg-white dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                        ↵
                      </kbd>
                    </button>
                  ))}
                  {filteredQuickActions.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm italic">
                      No matching command shortcuts found
                    </div>
                  )}
                </div>
              </div>
            )}

            {!query && recentItems.length > 0 && (
              <div className="p-2">
                <div className="px-2 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History className="h-3 w-3" /> Recently Viewed
                </div>
                <div className="space-y-1">
                  {recentItems.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleNavigate(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 group transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                        {item.type === 'project' && <FileText className="h-4 w-4" />}
                        {item.type === 'user' && <User className="h-4 w-4" />}
                        {item.type === 'task' && <CheckSquare className="h-4 w-4" />}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-700">{item.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{item.type}</div>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!query && recentItems.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Command className="h-10 w-10 mb-4 opacity-10" />
                <p className="text-sm font-medium">Type a name, project, or task to begin...</p>
              </div>
            )}

            {query && !isLoading && !hasResults && (
              <div className="py-12 text-center text-slate-400 text-sm">
                No results found for "{query}"
              </div>
            )}

            {hasResults && (
              <div className="space-y-4 p-2">
                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-2 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Projects</div>
                    {results.projects.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => handleNavigate({ id: p.id, name: p.name, type: 'project', path: `/projects/${p.id}` })}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-white transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.client_name}</div>
                          </div>
                        </div>
                        <Badge variant="glass" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View Project <ArrowRight className="ml-1 h-3 w-3" />
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div>
                    <div className="px-2 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Team Members</div>
                    {results.users.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => handleNavigate({ id: u.id, name: `${u.first_name} ${u.last_name}`, type: 'user', path: `/admin/users` })}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 group transition-colors"
                      >
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-white transition-colors">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{u.role.replace('_', ' ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-2 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Tasks</div>
                    {results.tasks.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => handleNavigate({ id: t.id, name: t.title, type: 'task', path: `/projects/${t.project_id}` })}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 group transition-colors"
                      >
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-white transition-colors">
                          <CheckSquare className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-900">{t.title}</div>
                          <div className="text-[11px] text-slate-400 uppercase tracking-tighter">{t.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-white/5 px-4 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><kbd className="border dark:border-white/10 bg-white dark:bg-slate-800 px-1 rounded">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="border dark:border-white/10 bg-white dark:bg-slate-800 px-1 rounded">↑↓</kbd> Navigate</span>
            </div>
            <span>Press <kbd className="border dark:border-white/10 bg-white dark:bg-slate-800 px-1 rounded">esc</kbd> to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
