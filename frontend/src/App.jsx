import { RouterProvider } from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";
import { useAuth } from "./features/auth/hooks/useAuth";

function AppRouterContainer() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        color: '#a1a1aa',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '2px', background: '#ff2d78', borderRadius: '4px' }} />
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Initializing Arena Engine...
          </span>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <AppRouterContainer />
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;