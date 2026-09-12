import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import LeaveBalance from "./pages/LeaveBalance";
import Payroll from "./pages/Payroll";
import PayrollReports from "./pages/PayrollReports";
import Users from "./pages/Users";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import AttendanceReports from "./pages/AttendanceReports";
import EmployeeAttendanceSummary from "./pages/EmployeeAttendanceSummary";
import HRReports from "./pages/HRReports";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================================================= */}
        {/* DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
                "Employee",
              ]}
            >
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* EMPLOYEES */}
        {/* ================================================= */}

        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
              ]}
            >
              <MainLayout>
                <Employees />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* DEPARTMENTS */}
        {/* ================================================= */}

        <Route
          path="/departments"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
              ]}
            >
              <MainLayout>
                <Departments />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* ATTENDANCE */}
        {/* ================================================= */}

        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
                "Employee",
              ]}
            >
              <MainLayout>
                <Attendance />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* LEAVE */}
        {/* ================================================= */}

        <Route
          path="/leave"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
                "Employee",
              ]}
            >
              <MainLayout>
                <Leave />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-balance"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "HR", "Manager", "Employee"]}
            >
              <MainLayout>
                <LeaveBalance />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* PAYROLL */}
        {/* ================================================= */}

        <Route
          path="/payroll"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
              ]}
            >
              <MainLayout>
                <Payroll />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payroll-reports"
          element={
            <ProtectedRoute allowedRoles={["Admin", "HR", "Manager"]}>
              <MainLayout>
                <PayrollReports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* USER MANAGEMENT */}
        {/* ================================================= */}

        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
              ]}
            >
              <MainLayout>
                <Users />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* REPORTS */}
        {/* ================================================= */}

        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
              ]}
            >
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* DEFAULT */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <NavigateToDashboard />
          }
        />

       <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Manager",
                "Employee",
              ]}
            >
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
  path="/attendance-reports"
  element={
    <ProtectedRoute
      allowedRoles={[
        "Admin",
        "HR",
        "Manager",
      ]}
    >
      <MainLayout>
        <AttendanceReports />
      </MainLayout>
    </ProtectedRoute>
  }
/>

        <Route
          path="/employee-attendance-summary"
          element={
            <ProtectedRoute allowedRoles={["Admin", "HR", "Manager"]}>
              <MainLayout>
                <EmployeeAttendanceSummary />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr-reports"
          element={
            <ProtectedRoute allowedRoles={["Admin", "HR", "Manager"]}>
              <MainLayout>
                <HRReports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

// Simple default redirect component
function NavigateToDashboard() {
  return <DashboardRedirect />;
}

function DashboardRedirect() {
  window.location.href = "/dashboard";
  return null;
}

export default App;