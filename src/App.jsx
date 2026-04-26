// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DeviceDetail from "./pages/DeviceDetail";
import AddDevice from "./pages/AddDevice";
import Profile from "./pages/Profile";
import Sync from "./pages/Sync";
import Alerts from "./pages/Alerts";

export default function App() {
  return (
    <BrowserRouter
    future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/device/:id"  element={<DeviceDetail />} />
              <Route path="/add-device"  element={<AddDevice />} />
              <Route path="/sync"        element={<Sync />} />
              <Route path="/alerts"      element={<Alerts />} />
              <Route path="/profile"     element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
