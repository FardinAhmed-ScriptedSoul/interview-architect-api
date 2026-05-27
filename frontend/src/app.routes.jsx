import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login.jsx";
import Register from "./features/auth/pages/Register.jsx";
import Protected from "./features/auth/components/Protected.jsx";
import Home from "./features/interview/pages/Home.jsx";
import Interview from "./features/interview/pages/Interview.jsx";
import ResetPassword from "./features/auth/pages/ResetPassword.jsx";
import ForgotPassword from "./features/auth/pages/ForgotPassword.jsx";
import ProfileDashboard from "./features/users/components/ProfileDashboard.jsx";
import SandboxSession from "./features/users/components/SandboxSession.jsx";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <Protected>
        <Home />
      </Protected>
    ),
  },
  {
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <Interview />
      </Protected>
    ),
  },
  {
    path: "/profile",
    element: (
      <Protected>
        <ProfileDashboard />
      </Protected>
    ),
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/sandbox/:questionId",
    element: (
      <Protected>
        <SandboxSession />
      </Protected>
    ),
  },
]);