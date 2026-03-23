import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, Building2, Clock } from "lucide-react";
import { attendanceApi } from "@/api/attendance";
import { getErrorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardSkeleton, ErrorState } from "@/components/shared/StateDisplays";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AnimatedCard,
  FloatingCard,
  AnimatedCounter,
  ThreeCard,
} from "@/components/motion";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => attendanceApi.getDashboard(),
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnMount: "always",
  });

  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your organization" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your organization" />
        <ErrorState
          message={getErrorMessage(dashboardQuery.error)}
          onRetry={() => dashboardQuery.refetch()}
        />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: "Total Employees",
      value: data.total_employees,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      threeColor: "#3b82f6",
    },
    {
      title: "Departments",
      value: data.department_count,
      icon: Building2,
      color: "text-purple-600",
      bg: "bg-purple-50",
      threeColor: "#9333ea",
    },
    {
      title: "Present Today",
      value: data.today_present,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      threeColor: "#059669",
    },
    {
      title: "Absent Today",
      value: data.today_absent,
      icon: UserX,
      color: "text-rose-600",
      bg: "bg-rose-50",
      threeColor: "#e11d48",
    },
  ];

  const attendanceRate =
    data.total_employees > 0
      ? (data.today_present / data.total_employees) * 100
      : 0;

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your organization" />

      {/* Stat cards with Three.js backgrounds */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <AnimatedCard key={card.title} delay={i * 0.1}>
            <ThreeCard color={card.threeColor}>
              <Card className="border-0 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </p>
                      <p className="mt-1 text-3xl font-bold">
                        <AnimatedCounter value={card.value} duration={1.2} />
                      </p>
                    </div>
                    <motion.div
                      className={`rounded-lg p-3 ${card.bg}`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </ThreeCard>
          </AnimatedCard>
        ))}
      </div>

      {/* Attendance rate + Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="mt-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FloatingCard delay={0.2}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Today's Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-600">
                    <AnimatedCounter
                      value={attendanceRate}
                      duration={1.8}
                      suffix="%"
                      decimals={1}
                    />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({data.today_present} of {data.total_employees})
                  </span>
                </div>
                {data.today_unmarked > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-3 flex items-center gap-2 text-sm text-amber-600"
                  >
                    <Clock className="h-4 w-4" />
                    {data.today_unmarked} employee
                    {data.today_unmarked > 1 ? "s" : ""} unmarked
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard delay={0.3}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Employees</span>
                  <span className="font-medium">{data.total_employees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Departments</span>
                  <span className="font-medium">{data.department_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today's Date</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </FloatingCard>
        </div>
      </motion.div>

      {/* Department breakdown with GSAP stagger */}
      {data.department_breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Department Breakdown (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Unmarked</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {data.department_breakdown.map((dept, i) => {
                      const rate =
                        dept.total > 0
                          ? ((dept.present / dept.total) * 100).toFixed(0)
                          : "0";
                      return (
                        <motion.tr
                          key={dept.department}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {dept.department}
                          </TableCell>
                          <TableCell className="text-center">{dept.total}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">
                            {dept.present}
                          </TableCell>
                          <TableCell className="text-center text-rose-600 font-medium">
                            {dept.absent}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {dept.unmarked}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={
                                Number(rate) >= 75
                                  ? "bg-emerald-100 text-emerald-700"
                                  : Number(rate) >= 50
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                              }
                            >
                              {rate}%
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
