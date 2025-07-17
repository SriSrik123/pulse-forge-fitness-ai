
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import { WorkoutList } from "./components/WorkoutList";
import { WorkoutDetail } from "./components/WorkoutDetail";
import { WorkoutExecution } from "./components/WorkoutExecution";
import { CreateWorkout } from "./components/CreateWorkout";
import { GoalsList } from "./components/GoalsList";
import { CreateGoal } from "./components/CreateGoal";
import { ProgressTracker } from "./components/ProgressTracker";
import { Layout } from "./components/Layout";
import { AuthWrapper } from "./components/AuthWrapper";
import { Toaster } from "@/components/ui/toaster";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthWrapper>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="workouts" element={<WorkoutList />} />
                <Route path="workout/:id" element={<WorkoutDetail />} />
                <Route path="workout/:id/execute" element={<WorkoutExecution />} />
                <Route path="create-workout" element={<CreateWorkout />} />
                <Route path="goals" element={<GoalsList />} />
                <Route path="create-goal" element={<CreateGoal />} />
                <Route path="progress" element={<ProgressTracker />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </AuthWrapper>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
