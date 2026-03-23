import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Users, CalendarCheck, LayoutDashboard } from "lucide-react";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "@/components/motion";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
];

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.08,
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  }),
};

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-background">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex h-14 items-center border-b px-6"
        >
          <h1 className="text-lg font-semibold tracking-tight">HRMS Lite</h1>
        </motion.div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item, i) => (
            <motion.div
              key={item.to}
              custom={i}
              variants={sidebarItemVariants}
              initial="hidden"
              animate="visible"
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative overflow-hidden ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-primary rounded-lg"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t p-4"
        >
          <p className="text-xs text-muted-foreground">HRMS Lite v1.0</p>
        </motion.div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="flex h-14 items-center border-b bg-background px-6 md:hidden">
          <h1 className="text-lg font-semibold">HRMS Lite</h1>
        </header>

        {/* Mobile nav */}
        <nav className="flex border-b bg-background px-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Page content with AnimatePresence */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </AnimatePresence>
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
