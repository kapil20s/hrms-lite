// ── API Envelope ──────────────────────────────────────────────
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ── Employee ─────────────────────────────────────────────────
export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  name: string;
  email: string;
  department: string;
}

export interface EmployeeUpdate {
  name?: string;
  email?: string;
  department?: string;
}

// ── Attendance ───────────────────────────────────────────────
export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_department: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
}

export interface AttendanceCreate {
  employee_id: number;
  date: string;
  status: AttendanceStatus;
}

export interface AttendanceUpdate {
  status: AttendanceStatus;
}

export interface AttendanceBulkCreate {
  date: string;
  records: { employee_id: number; status: AttendanceStatus }[];
}

export interface AttendanceSummary {
  employee_id: number;
  employee_name: string;
  employee_department: string;
  total_present: number;
  total_absent: number;
  total_days: number;
  attendance_percentage: number;
}

// ── Dashboard ────────────────────────────────────────────────
export interface DashboardSummary {
  total_employees: number;
  department_count: number;
  today_present: number;
  today_absent: number;
  today_unmarked: number;
  department_breakdown: DepartmentBreakdown[];
}

export interface DepartmentBreakdown {
  department: string;
  total: number;
  present: number;
  absent: number;
  unmarked: number;
}
