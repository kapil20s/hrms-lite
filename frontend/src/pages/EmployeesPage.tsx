import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { employeesApi } from "@/api/employees";
import { getErrorMessage } from "@/api/client";
import type { Employee, EmployeeCreate } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/shared/StateDisplays";
import { EmployeeDialog } from "@/components/employees/EmployeeDialog";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // ── Queries ──────────────────────────────────────────────
  const employeesQuery = useQuery({
    queryKey: ["employees", { search, department: deptFilter }],
    queryFn: () =>
      employeesApi.list({
        search: search || undefined,
        department: deptFilter === "all" ? undefined : deptFilter,
      }),
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => employeesApi.getDepartments(),
  });

  // ── Mutations ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: EmployeeCreate) => employeesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDialogOpen(false);
      toast.success("Employee created successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeCreate }) =>
      employeesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditingEmployee(null);
      toast.success("Employee updated successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTarget(null);
      toast.success("Employee deleted successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ── Handlers ─────────────────────────────────────────────
  const handleCreate = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setDialogOpen(true);
  };

  const handleSubmit = (data: EmployeeCreate) => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const employees = employeesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const isLoading = employeesQuery.isLoading;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader title="Employees" description="Manage your organization's employees">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </motion.div>
      </PageHeader>

      {/* Filters with animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mb-4 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table with animated rows */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : employeesQuery.isError ? (
        <ErrorState
          message={getErrorMessage(employeesQuery.error)}
          onRetry={() => employeesQuery.refetch()}
        />
      ) : employees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyState
            title="No employees found"
            description={
              search || deptFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first employee."
            }
            action={
              !search && deptFilter === "all"
                ? { label: "Add Employee", onClick: handleCreate }
                : undefined
            }
          />
        </motion.div>
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
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {employees.map((emp, i) => (
                    <motion.tr
                      key={emp.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{emp.employee_id}</TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {emp.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{emp.department}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(emp)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(emp)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}

      {/* Dialogs */}
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSubmit={handleSubmit}
        isLoading={isMutating}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all their attendance records.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
