import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, CalendarIcon, UserCheck, UserX, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { attendanceApi } from "@/api/attendance";
import { employeesApi } from "@/api/employees";
import { getErrorMessage } from "@/api/client";
import type { Employee, AttendanceStatus } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/shared/StateDisplays";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AnimatedCard, AnimatedCounter } from "@/components/motion";

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  }),
};

const statusVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 25 } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.15 } },
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<"mark" | "summary">("mark");

  // ── Queries ──────────────────────────────────────────────
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.list(),
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance", { date: selectedDate }],
    queryFn: () => attendanceApi.list({ date: selectedDate }),
  });

  const summaryQuery = useQuery({
    queryKey: ["attendance-summary"],
    queryFn: () => attendanceApi.getSummary(),
    enabled: viewMode === "summary",
  });

  // ── Mutations ────────────────────────────────────────────
  const bulkMutation = useMutation({
    mutationFn: attendanceApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Attendance saved successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ── Local state for marking ──────────────────────────────
  const employees = employeesQuery.data ?? [];
  const records = attendanceQuery.data ?? [];

  const existingMap = useMemo(() => {
    const map = new Map<number, { status: AttendanceStatus; id: number }>();
    for (const r of records) {
      map.set(r.employee_id, { status: r.status, id: r.id });
    }
    return map;
  }, [records]);

  const [localStatus, setLocalStatus] = useState<Map<number, AttendanceStatus>>(new Map());

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setLocalStatus(new Map());
  };

  const getStatus = (empId: number): AttendanceStatus | null => {
    if (localStatus.has(empId)) return localStatus.get(empId)!;
    if (existingMap.has(empId)) return existingMap.get(empId)!.status;
    return null;
  };

  const toggleStatus = (empId: number, status: AttendanceStatus) => {
    setLocalStatus((prev) => {
      const next = new Map(prev);
      const current = getStatus(empId);
      if (current === status) {
        next.delete(empId);
      } else {
        next.set(empId, status);
      }
      return next;
    });
  };

  const handleSaveAttendance = () => {
    const allRecords: { employee_id: number; status: AttendanceStatus }[] = [];
    for (const emp of employees) {
      const status = getStatus(emp.id);
      if (status) {
        allRecords.push({ employee_id: emp.id, status });
      }
    }
    if (allRecords.length === 0) {
      toast.error("Please mark attendance for at least one employee");
      return;
    }
    bulkMutation.mutate({ date: selectedDate, records: allRecords });
  };

  const markAllAs = (status: AttendanceStatus) => {
    const next = new Map<number, AttendanceStatus>();
    for (const emp of employees) {
      next.set(emp.id, status);
    }
    setLocalStatus(next);
  };

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let unmarked = 0;
    for (const emp of employees) {
      const s = getStatus(emp.id);
      if (s === "present") present++;
      else if (s === "absent") absent++;
      else unmarked++;
    }
    return { present, absent, unmarked, total: employees.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, existingMap, localStatus]);

  const summaries = summaryQuery.data ?? [];
  const isLoading = employeesQuery.isLoading || attendanceQuery.isLoading;

  return (
    <div>
      <PageHeader title="Attendance" description="Track daily employee attendance">
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant={viewMode === "mark" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("mark")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Daily View
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("summary")}
            >
              <Filter className="mr-2 h-4 w-4" />
              Summary
            </Button>
          </motion.div>
        </div>
      </PageHeader>

      <AnimatePresence mode="wait">
        {viewMode === "mark" ? (
          <motion.div
            key="mark"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Date selector + Quick actions */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-44"
                />
                {selectedDate === today && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Badge variant="secondary">Today</Badge>
                  </motion.div>
                )}
              </div>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAs("present")}
                  >
                    <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    Mark All Present
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAs("absent")}
                  >
                    <UserX className="mr-2 h-4 w-4 text-rose-600" />
                    Mark All Absent
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Stats cards with animation */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total", value: stats.total, color: "" },
                { label: "Present", value: stats.present, color: "text-emerald-600" },
                { label: "Absent", value: stats.absent, color: "text-rose-600" },
                { label: "Unmarked", value: stats.unmarked, color: "" },
              ].map((stat, i) => (
                <AnimatedCard key={stat.label} delay={i * 0.08}>
                  <Card>
                    <CardContent className="p-4">
                      <div className={`text-sm ${stat.color || "text-muted-foreground"}`}>
                        {stat.label}
                      </div>
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        <AnimatedCounter value={stat.value} duration={0.8} />
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>

            {/* Attendance table */}
            {isLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : employeesQuery.isError ? (
              <ErrorState
                message={getErrorMessage(employeesQuery.error)}
                onRetry={() => employeesQuery.refetch()}
              />
            ) : employees.length === 0 ? (
              <EmptyState
                title="No employees"
                description="Add employees first before marking attendance."
              />
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center w-40">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((emp: Employee, i: number) => {
                          const status = getStatus(emp.id);
                          return (
                            <motion.tr
                              key={emp.id}
                              custom={i}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">{emp.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {emp.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{emp.department}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <AnimatePresence mode="wait">
                                  {status === "present" && (
                                    <motion.div key="present" {...statusVariants}>
                                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                        Present
                                      </Badge>
                                    </motion.div>
                                  )}
                                  {status === "absent" && (
                                    <motion.div key="absent" {...statusVariants}>
                                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                                        Absent
                                      </Badge>
                                    </motion.div>
                                  )}
                                  {!status && (
                                    <motion.div key="unmarked" {...statusVariants}>
                                      <Badge variant="outline">Unmarked</Badge>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center gap-2">
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      size="sm"
                                      variant={status === "present" ? "default" : "outline"}
                                      className={
                                        status === "present"
                                          ? "bg-emerald-600 hover:bg-emerald-700"
                                          : ""
                                      }
                                      onClick={() => toggleStatus(emp.id, "present")}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      size="sm"
                                      variant={status === "absent" ? "default" : "outline"}
                                      className={
                                        status === "absent"
                                          ? "bg-rose-600 hover:bg-rose-700"
                                          : ""
                                      }
                                      onClick={() => toggleStatus(emp.id, "absent")}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-4 flex justify-end"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleSaveAttendance}
                      disabled={bulkMutation.isPending}
                      size="lg"
                    >
                      {bulkMutation.isPending ? "Saving..." : "Save Attendance"}
                    </Button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </motion.div>
        ) : (
          /* ── Summary View ─────────────────────────────────── */
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {summaryQuery.isLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : summaryQuery.isError ? (
              <ErrorState
                message={getErrorMessage(summaryQuery.error)}
                onRetry={() => summaryQuery.refetch()}
              />
            ) : summaries.length === 0 ? (
              <EmptyState
                title="No attendance data"
                description="Start marking attendance to see summary statistics."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Total Days</TableHead>
                        <TableHead className="text-center">Attendance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaries.map((s, i) => (
                        <motion.tr
                          key={s.employee_id}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{s.employee_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{s.employee_department}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">
                            {s.total_present}
                          </TableCell>
                          <TableCell className="text-center text-rose-600 font-medium">
                            {s.total_absent}
                          </TableCell>
                          <TableCell className="text-center">{s.total_days}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                s.attendance_percentage >= 75 ? "default" : "destructive"
                              }
                              className={
                                s.attendance_percentage >= 75
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : ""
                              }
                            >
                              {s.attendance_percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
