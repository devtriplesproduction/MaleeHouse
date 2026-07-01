"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { 
  Users, UserPlus, Mail, Power, Search, Filter, SlidersHorizontal,
  LayoutGrid, Table, Calendar, MapPin, Key, Eye, Edit3,
  Building2, BadgeInfo, CheckCircle2, AlertCircle, RefreshCw, ChevronDown,
  CreditCard, Shield, ShieldCheck, Lock, Unlock, Wallet, Check, Loader2, FileText, Activity,
  EyeOff, ChevronLeft, ChevronRight, UserX, Trash2, MoreVertical, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  toggleUserActiveAction, 
  resetUserPasswordAction, 
  getAllUsersAction,
  getAdminAuditLogsAction,
  overrideUserCredentialsAction,
  offboardEmployeeAction,
  deleteEmployeeAction
} from "@/actions/admin.actions";
import { 
  calculateMonthlyPayrollAction, 
  lockPayrollCycleAction 
} from "@/actions/payroll.actions";
import { OnboardUserModal } from "@/components/modules/OnboardUserModal";
import { EmployeeProfileModal } from "@/components/modules/EmployeeProfileModal";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, getDesignationsForDepartment } from "@/config/departments";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  phone_number?: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  dob?: string;
  gender?: string;
  personal_email?: string;
  address?: string;
  emergency_contact?: string;
  profile_photo?: string;
  employment_type?: string;
  salary?: number;
  experience?: number;
  location?: string;
  reporting_manager_id?: string;
  department_head_id?: string;
  branch?: string;
  office_location?: string;
  operational_zone?: string;
  approval_authority?: boolean;
  escalation_chain?: any[];
  status?: string;
  documents?: any[];
  joining_date?: string;
}

interface UserManagementTableProps {
  initialUsers: UserProfile[];
  mode?: "full" | "payroll-only";
}

const avatarColors = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25",
  "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
];

function getAvatarColor(name: string) {
  if (!name) return avatarColors[0];
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export function UserManagementTable({ initialUsers, mode = "full" }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"directory" | "payroll" | "security">(mode === "payroll-only" ? "payroll" : "directory");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  
  // Filtering & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [oneTimePassModal, setOneTimePassModal] = useState<string | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Payroll state
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [isPayrollLocked, setIsPayrollLocked] = useState(false);
  const [isPayrollLoading, setIsPayrollLoading] = useState(false);
  const [isLockingPayroll, setIsLockingPayroll] = useState(false);
  const [payrollSearch, setPayrollSearch] = useState("");

  // Security state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [overridePasswords, setOverridePasswords] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [isOverriding, setIsOverriding] = useState<Record<string, boolean>>({});

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRefreshData = async () => {
    const res = await getAllUsersAction();
    if (res.success && res.data) {
      setUsers(res.data);
    }
  };

  // Fetch reactive data for payroll or security tabs
  const fetchPayroll = async (month: number, year: number) => {
    setIsPayrollLoading(true);
    try {
      const res = await calculateMonthlyPayrollAction(month, year);
      if (res.success && res.data) {
        setPayrollData(res.data);
        setIsPayrollLocked(!!res.isLocked);
      } else {
        toast({ title: "Failed to compute payroll", description: res?.error, variant: "error" });
      }
    } catch (err) {
      toast({ title: "Failed to compute payroll", variant: "error" });
    } finally {
      setIsPayrollLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await getAdminAuditLogsAction();
      if (res.success && res.data) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payroll") {
      fetchPayroll(payrollMonth, payrollYear);
    } else if (activeTab === "security") {
      fetchAuditLogs();
    }
  }, [activeTab, payrollMonth, payrollYear]);

  const handleLockPayroll = async () => {
    if (!confirm(`Are you absolutely sure you want to FREEZE payroll for ${payrollMonth}/${payrollYear}? This locks the data cycle and logs immutable records.`)) return;
    setIsLockingPayroll(true);
    try {
      const res = await lockPayrollCycleAction(payrollMonth, payrollYear);
      if (res?.success) {
        toast({ title: "Payroll Frozen", description: res.message, variant: "success" });
        fetchPayroll(payrollMonth, payrollYear);
      } else {
        toast({ title: "Lock Failed", description: res?.error, variant: "error" });
      }
    } catch (err) {
      toast({ title: "Lock failed", variant: "error" });
    } finally {
      setIsLockingPayroll(false);
    }
  };

  // Status mapping colors
  const getStatusBadgeStyles = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "onboarding_pending":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "invited":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "suspended":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "resigned":
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
      case "archived":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
    }
  };

  // Department colors mapping
  const getDeptBadgeStyles = (dept?: string) => {
    switch (dept) {
      case "admin":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/25";
      case "operations":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/25";
      case "survey":
        return "bg-teal-500/10 text-teal-500 border-teal-500/25";
      case "design":
        return "bg-purple-500/10 text-purple-500 border-purple-500/25";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/25";
    }
  };

  // Dynamic designations based on selected department filter
  const designationsList = useMemo(() => {
    if (selectedDept === "all") {
      const allDesignations = DEPARTMENTS.flatMap(d => d.designations);
      return Array.from(new Map(allDesignations.map((r: any) => [r.id, r])).values());
    }
    return getDesignationsForDepartment(selectedDept);
  }, [selectedDept]);

  // Combined Filters Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const employeeId = (u.employee_id || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = fullName.includes(search) || email.includes(search) || employeeId.includes(search);
      const matchesDept = selectedDept === "all" || u.department === selectedDept;
      const matchesRole = selectedRole === "all" || u.designation === selectedRole;
      const matchesStatus = selectedStatus === "all" || u.status === selectedStatus;

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedDept, selectedRole, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedRole, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);
  }, [filteredUsers, safeCurrentPage]);

  // Account Status administrative toggle
  const handleToggleStatus = async (userId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleUserActiveAction(userId, !currentStatus);
      if (result?.success) {
        toast({
          title: "Access Override Triggered",
          description: `Employee profile successfully ${!currentStatus ? 'activated' : 'suspended'}.`,
          variant: "success"
        });
        handleRefreshData();
      } else {
        toast({
          title: "Administrative Gate Denied",
          description: result?.error || "Failed to update profile access",
          variant: "error"
        });
      }
    });
  };

  // Administrative password reset
  const handleResetPassword = async (userId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Refresh access credentials and reset password for ${name}?`)) {
      try {
        const result = await resetUserPasswordAction(userId);
        if (result?.success) {
          setOneTimePassModal(result.tempPassword!);
          toast({
            title: "Access Code Refreshed",
            description: "Temporary password generated successfully.",
            variant: "success"
          });
          handleRefreshData();
        } else {
          toast({
            title: "Action Aborted",
            description: result?.error,
            variant: "error"
          });
        }
      } catch (err) {
        toast({
          title: "Reset Prevented",
          description: "Credential manager encountered a lock failure.",
          variant: "error"
        });
      }
    }
  };

  // Offboard employee
  const handleOffboardEmployee = async (userId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to offboard ${name}? This will suspend system access and mark their status as resigned.`)) {
      startTransition(async () => {
        const result = await offboardEmployeeAction(userId);
        if (result?.success) {
          toast({
            title: "Employee Offboarded",
            description: `${name} has been successfully offboarded and status updated to resigned.`,
            variant: "success"
          });
          handleRefreshData();
        } else {
          toast({
            title: "Offboarding Failed",
            description: result?.error || "Failed to offboard employee",
            variant: "error"
          });
        }
      });
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (userId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY delete ${name}? This action is irreversible and will delete their entire profile.`)) {
      startTransition(async () => {
        const result = await deleteEmployeeAction(userId);
        if (result?.success) {
          toast({
            title: "Employee Deleted",
            description: `${name} has been permanently deleted from the system.`,
            variant: "success"
          });
          handleRefreshData();
        } else {
          toast({
            title: "Deletion Failed",
            description: result?.error || "Failed to delete employee",
            variant: "error"
          });
        }
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "Credential Copied", 
      description: "Temporary key copied safely to clipboard buffer.",
      variant: "success" 
    });
  };

  const handleManualOverride = async (userId: string, email: string) => {
    const pwd = overridePasswords[userId];
    if (!pwd || pwd.trim().length < 4) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 4 characters long.",
        variant: "error"
      });
      return;
    }
    
    setIsOverriding(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await overrideUserCredentialsAction(userId, pwd);
      if (res?.success) {
        toast({
          title: "Override Success",
          description: `Access key modified safely for ${email}.`,
          variant: "success"
        });
        setOverridePasswords(prev => ({ ...prev, [userId]: "" }));
        handleRefreshData();
      } else {
        toast({
          title: "Override Failed",
          description: res?.error || "Credentials override unsuccessful.",
          variant: "error"
        });
      }
    } catch (err) {
      toast({
        title: "Override Failed",
        description: "An unexpected error occurred during credential update.",
        variant: "error"
      });
    } finally {
      setIsOverriding(prev => ({ ...prev, [userId]: false }));
    }
  };

  const generateRandomPasswordForUser = (userId: string) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOverridePasswords(prev => ({ ...prev, [userId]: pwd }));
    setVisiblePasswords(prev => ({ ...prev, [userId]: true }));
    toast({
      title: "Password Generated",
      description: "A random secure password has been generated for review.",
      variant: "success"
    });
  };
  const filteredPayrollData = useMemo(() => {
    if (!payrollSearch.trim()) return payrollData;
    const query = payrollSearch.toLowerCase().trim();
    return payrollData.filter((item: any) => 
      item.employee_name?.toLowerCase().includes(query) ||
      item.employee_id_external?.toLowerCase().includes(query) ||
      item.department?.toLowerCase().includes(query) ||
      item.designation?.toLowerCase().includes(query)
    );
  }, [payrollData, payrollSearch]);

  const zeroAbsenceCount = useMemo(() => {
    return payrollData.filter((item: any) => (item.days_absent || 0) === 0).length;
  }, [payrollData]);

  const activePayrollCount = payrollData.length;

  const totalBaseSalary = useMemo(() => {
    return payrollData.reduce((sum: any, item: any) => sum + (item.base_salary || 0), 0);
  }, [payrollData]);

  const totalNetPayable = useMemo(() => {
    return payrollData.reduce((sum: any, item: any) => sum + (item.net_payable || 0), 0);
  }, [payrollData]);

  const handlePrevMonth = () => {
    if (payrollMonth === 1) {
      setPayrollMonth(12);
      setPayrollYear(prev => prev - 1);
    } else {
      setPayrollMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (payrollMonth === 12) {
      setPayrollMonth(1);
      setPayrollYear(prev => prev + 1);
    } else {
      setPayrollMonth(prev => prev + 1);
    }
  };

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Global Title & Stats Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {mode === "payroll-only" ? (
              <>Salary <span className="text-indigo-500 dark:text-indigo-400">Records</span></>
            ) : (
              <>Team <span className="text-indigo-500 dark:text-indigo-400">Management</span></>
            )}
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {mode === "payroll-only" ? "Read-only view of historical payroll cycles and live adjustments." : "Manage permissions, invite surveyors, and maintain system security."}
          </p>
        </div>

        {mode !== "payroll-only" && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsNewUserModalOpen(true)}
              variant="premium"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-10 px-4"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Employee
            </Button>
          </div>
        )}
      </div>

      {/* Minified Quick Stats Row */}
      {mode !== "payroll-only" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Staff */}
          <div className="glass-card px-4 py-3 flex items-center justify-between border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Staff</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">{users.length}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="glass-card px-4 py-3 flex items-center justify-between border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Active Accounts</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">
                  {users.filter((u: any) => u.is_active).length}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Admins */}
          <div className="glass-card px-4 py-3 flex items-center justify-between border-amber-500/10 hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Admins</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">
                  {users.filter((u: any) => u.role === 'admin').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Tab Navigation */}
      {mode !== "payroll-only" && (
        <div className="flex border-b border-slate-200 dark:border-white/5 mb-6 overflow-x-auto gap-8 scrollbar-none">
          <button
            onClick={() => setActiveTab("directory")}
            className={cn(
              "flex items-center gap-2 px-2 py-4 text-sm font-bold transition-all relative shrink-0",
              activeTab === "directory"
                ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Users className="w-4 h-4" />
            Personnel Directory
            {activeTab === "directory" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("payroll")}
            className={cn(
              "flex items-center gap-2 px-2 py-4 text-sm font-bold transition-all relative shrink-0",
              activeTab === "payroll"
                ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Integrated Payroll
            {activeTab === "payroll" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex items-center gap-2 px-2 py-4 text-sm font-bold transition-all relative shrink-0",
              activeTab === "security"
                ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Shield className="w-4 h-4" />
            Account Security
            {activeTab === "security" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAB: PERSONNEL DIRECTORY                                               */}
      {/* ========================================================================= */}
      {activeTab === "directory" && (
        <div className="space-y-6 font-sans">
          
          <div className="glass-card overflow-hidden">
            {/* ── Toolbar ── */}
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-white/5 flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-white/50 dark:bg-white/[0.02]">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or serial ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400 text-slate-800 dark:text-white"
                />
              </div>

              {/* Select filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>

                <Select 
                  value={selectedDept}
                  onValueChange={(val) => {
                    setSelectedDept(val);
                    setSelectedRole("all");
                  }}
                  placeholder="All Departments"
                  className="w-40"
                  buttonClassName="h-9 px-3.5"
                >
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </Select>

                <Select 
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val)}
                  placeholder="All Statuses"
                  className="w-40"
                  buttonClassName="h-9 px-3.5"
                >
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="onboarding_pending">Onboarding Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Employee</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Role</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Department</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Contact</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Joined</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Status</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                              No personnel found
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                              Try adjusting your search or filter criteria.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedEmployee(user)}
                        className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <img 
                                src={user.profile_photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"}
                                alt={`${user.first_name} avatar`}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10"
                              />
                              <span className={cn(
                                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0c101b]",
                                user.is_active ? "bg-emerald-500" : "bg-slate-400"
                              )} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs font-mono text-slate-400 mt-0.5">
                                {user.employee_id || "MH-EMP-N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-sm font-semibold bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 capitalize">
                            {user.designation?.replace("_", " ") || user.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-sm font-semibold border capitalize inline-block",
                            getDeptBadgeStyles(user.department)
                          )}>
                            {user.department || "General"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {user.email}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {user.joining_date ? new Date(user.joining_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold border",
                            getStatusBadgeStyles(user.status)
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                            {user.status?.replace("_", " ") || (user.is_active ? "Active" : "Suspended")}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id);
                              }}
                              className={cn(
                                "p-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 rounded-xl transition-all",
                                activeMenuUserId === user.id ? "bg-slate-100 dark:bg-white/10 text-indigo-500" : ""
                              )}
                              title="Actions"
                            >
                              <MoreVertical className="w-4.5 h-4.5" />
                            </button>

                            {activeMenuUserId === user.id && (
                              <>
                                {/* Overlay/Backdrop to close dropdown when clicked outside */}
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setActiveMenuUserId(null)} 
                                />
                                <div className="absolute right-6 top-12 w-48 bg-[#0f121d] border border-slate-800/80 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                  <button
                                    onClick={() => {
                                      setActiveMenuUserId(null);
                                      setSelectedEmployee(user);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                  >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span>View Profile</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      setActiveMenuUserId(null);
                                      handleToggleStatus(user.id, user.is_active, e);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                  >
                                    {user.is_active ? (
                                      <>
                                        <UserX className="w-4 h-4 text-slate-400" />
                                        <span>Set Inactive</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 text-slate-400" />
                                        <span>Set Active</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="my-1.5 border-t border-slate-800/50" />

                                  <button
                                    onClick={(e) => {
                                      setActiveMenuUserId(null);
                                      handleDeleteEmployee(user.id, `${user.first_name} ${user.last_name}`, e);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Footer ── */}
            {filteredUsers.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.01]">
                <p className="text-xs text-slate-400 font-medium">
                  Showing{' '}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {(safeCurrentPage - 1) * PAGE_SIZE + 1}
                  </span>{' '}
                  –{' '}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {Math.min(safeCurrentPage * PAGE_SIZE, filteredUsers.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {filteredUsers.length}
                  </span>{' '}
                  personnel
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${page === safeCurrentPage
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40"
                          }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: INTEGRATED PAYROLL                                                */}
      {/* ========================================================================= */}
      {activeTab === "payroll" && (
        <div className="space-y-6 font-sans">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Net Payout Sum */}
            <div className="glass-card p-6 relative overflow-hidden bg-white/50 dark:bg-white/[0.02]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
              <p className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                ₹{totalNetPayable.toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cycle: {new Date(2026, payrollMonth - 1).toLocaleString('default', { month: 'long' })} {payrollYear}
                </span>
              </div>
            </div>
            
            {/* Card 2: Attendance Adjustments */}
            <div className="glass-card p-6 relative overflow-hidden bg-white/50 dark:bg-white/[0.02]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
              <p className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                ₹{(totalBaseSalary - totalNetPayable).toLocaleString('en-IN')}
              </p>
              <p className="text-sm font-bold text-rose-500 dark:text-rose-400/80 mt-3 uppercase tracking-wider">
                Attendance-based adjustments
              </p>
            </div>

            {/* Card 3: Absences Metric */}
            <div className="glass-card p-6 relative overflow-hidden bg-white/50 dark:bg-white/[0.02]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
              <p className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                {zeroAbsenceCount}/{payrollData.length || 0}
              </p>
              <p className="text-sm font-bold text-blue-500 dark:text-blue-400/80 mt-3 uppercase tracking-wider">
                Employees with zero absences
              </p>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            {/* ── Toolbar ── */}
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-white/5 flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-white/50 dark:bg-white/[0.02]">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                  placeholder="Filter financial records..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all text-sm placeholder:text-slate-400 text-slate-800 dark:text-white"
                />
              </div>

              {/* Navigation + Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Month selector with arrows */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl p-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="h-7 w-7 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <div className="px-3 text-sm font-black tracking-widest text-slate-700 dark:text-slate-200 min-w-[100px] text-center uppercase">
                    {monthNames[payrollMonth - 1]} {payrollYear}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-7 w-7 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="h-9 px-3.5 flex items-center gap-2 border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Reports
                </Button>

                <Button
                  onClick={handleLockPayroll}
                  disabled={isPayrollLocked || isLockingPayroll || payrollData.length === 0}
                  className={cn(
                    "h-9 px-4 flex items-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    isPayrollLocked 
                      ? "bg-emerald-600/10 text-emerald-500 border border-emerald-500/25 cursor-default hover:bg-emerald-600/10"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 border-none"
                  )}
                >
                  {isLockingPayroll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPayrollLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  {isPayrollLocked ? "Locked" : "Lock Cycle"}
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Identity</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Base Salary</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Attendance</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Deductions</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Net Payout</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {isPayrollLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                          <div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                              Computing live metrics...
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                              Retrieving attendance records and wage proration factors.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayrollData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                              No financial records found
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                              No personnel data available for this cycle.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPayrollData.map((item) => {
                      const totalDays = 26;
                      const earnedDays = item.days_present + item.days_field + item.days_paid_leave;
                      const deductions = item.base_salary - item.net_payable;
                      
                      return (
                        <tr 
                          key={item.id} 
                          className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150"
                        >
                          {/* Identity */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0",
                                getAvatarColor(item.employee_name)
                              )}>
                                {item.employee_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
                                  {item.employee_name}
                                </p>
                                <p className="text-xs font-mono text-slate-400 mt-0.5 capitalize">
                                  {item.department || "General"} • {item.designation || "Staff"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Base Salary */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                ₹{(item.base_salary || 0).toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs font-mono text-slate-400 mt-0.5">
                                Fixed Rate
                              </p>
                            </div>
                          </td>

                          {/* Attendance */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {earnedDays}D / {totalDays}D
                              </div>
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shrink-0">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full" 
                                  style={{ width: `${Math.min(100, (earnedDays / totalDays) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Deductions */}
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-sm font-semibold",
                              deductions > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                            )}>
                              {deductions > 0 ? `-₹${deductions.toLocaleString('en-IN')}` : "₹0"}
                            </span>
                          </td>

                          {/* Net Payout */}
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{(item.net_payable || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Action Details */}
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 rounded-xl transition-all"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!isPayrollLoading && filteredPayrollData.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.01]">
                <p className="text-xs text-slate-400 font-medium">
                  Showing{' '}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {filteredPayrollData.length}
                  </span>{' '}
                  records
                </p>
                <p className="text-xs text-slate-400">
                  Select month cycle to review historic records
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: ACCOUNT SECURITY                                                  */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-300 font-sans">
          
          {/* Security Protocol Banner */}
          <div className="glass-card p-5 border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Security Protocol</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Administrative Override Active</h3>
              </div>
            </div>
            <div className="md:max-w-sm border-l-2 border-slate-200 dark:border-white/10 pl-4">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Direct authority to modify credentials. All changes are logged for auditing and take effect immediately.
              </p>
            </div>
          </div>

          {/* Main Panel */}
          <div className="glass-card overflow-hidden border-slate-200 dark:border-white/5">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-[#0a0d16]/30">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personnel Security Override</h3>
              <span className="text-xs font-semibold text-slate-500">{users.length} Personnel Accounts Found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0d16]/30">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Employee Identity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Access Level</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400 w-80">Credential Override</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                      {/* Employee Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5 capitalize">
                              {user.department || "General"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Access Level */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{user.email}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold uppercase tracking-widest text-indigo-500">
                              {user.designation?.replace("_", " ") || user.role}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest border",
                              user.is_active 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            )}>
                              {user.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Credential Override */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={visiblePasswords[user.id] ? "text" : "password"}
                              placeholder="Set new credentials..."
                              value={overridePasswords[user.id] || ""}
                              onChange={(e) => setOverridePasswords(prev => ({ ...prev, [user.id]: e.target.value }))}
                              className="w-full h-9 pl-3 pr-10 bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              {visiblePasswords[user.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => generateRandomPasswordForUser(user.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 transition-colors shrink-0"
                            title="Generate Random Password"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleManualOverride(user.id, user.email)}
                          disabled={isOverriding[user.id] || !(overridePasswords[user.id]?.length >= 4)}
                          variant="premium"
                          className="h-9 px-4 text-sm font-bold tracking-wider rounded-lg disabled:opacity-50"
                        >
                          {isOverriding[user.id] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Key className="w-3 h-3 mr-1.5" />
                              Update
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONE-TIME PASSWORD DIALOG OVERLAY */}
      {oneTimePassModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOneTimePassModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#080b14] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 text-indigo-500">
              <Key className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Temporary Key Generated</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xs mx-auto mt-1.5 leading-relaxed">
              Temporary access key refreshed. Securely transfer this password to the employee immediately.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-lg tracking-wider">
                {oneTimePassModal}
              </span>
              <Button 
                onClick={() => copyToClipboard(oneTimePassModal)}
                variant="outline"
                className="h-9 w-9 p-0 rounded-xl"
                title="Copy password key"
              >
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </Button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-2.5 text-left mb-6">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-normal">
                SECURITY WARNING: Visible ONLY ONCE. The password will be salted and hashed immediately upon closing.
              </p>
            </div>

            <Button 
              onClick={() => setOneTimePassModal(null)}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      )}

      {/* Onboard Wizard Dialog */}
      <OnboardUserModal 
        isOpen={isNewUserModalOpen} 
        onClose={() => setIsNewUserModalOpen(false)}
        existingUsers={users}
        onSuccess={handleRefreshData}
      />

      {/* Profile Detail Dialog */}
      <EmployeeProfileModal 
        isOpen={selectedEmployee !== null}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        existingUsers={users}
        onSuccess={handleRefreshData}
      />
    </div>
  );
}
