import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Employees from "./pages/Employees";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Login */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Future Pages */}

          <Route
  path="/employees"
  element={
    <ProtectedRoute>
      <MainLayout>
        <Employees />
      </MainLayout>
    </ProtectedRoute>
  }
/>

          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>
                    <h1>Departments</h1>
                    <p>Department management coming next.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>
                    <h1>Attendance</h1>
                    <p>Attendance management coming next.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>
                    <h1>Leave Management</h1>
                    <p>Leave management coming next.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>
                    <h1>Payroll</h1>
                    <p>Payroll management coming next.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>
                    <h1>User Management</h1>
                    <p>User management coming next.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* Unknown URL */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;