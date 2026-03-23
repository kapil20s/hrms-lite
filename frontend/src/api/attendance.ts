import { api, unwrap } from "./client";
import type {
  AttendanceRecord,
  AttendanceCreate,
  AttendanceUpdate,
  AttendanceBulkCreate,
  AttendanceSummary,
  DashboardSummary,
} from "@/types";

export interface AttendanceListParams {
  employee_id?: number;
  date?: string;
  month?: number;
  year?: number;
}

export const attendanceApi = {
  list: (params?: AttendanceListParams) =>
    api.get("/attendance", { params }).then(unwrap<AttendanceRecord[]>),

  create: (data: AttendanceCreate) =>
    api.post("/attendance", data).then(unwrap<AttendanceRecord>),

  bulkCreate: (data: AttendanceBulkCreate) =>
    api.post("/attendance/bulk", data).then(unwrap<AttendanceRecord[]>),

  update: (id: number, data: AttendanceUpdate) =>
    api.put(`/attendance/${id}`, data).then(unwrap<AttendanceRecord>),

  getSummary: (employeeId?: number) =>
    api
      .get("/attendance/summary", { params: employeeId ? { employee_id: employeeId } : {} })
      .then(unwrap<AttendanceSummary[]>),

  getDashboard: () =>
    api.get("/attendance/dashboard").then(unwrap<DashboardSummary>),
};
