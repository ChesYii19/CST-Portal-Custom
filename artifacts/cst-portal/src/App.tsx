import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/Shell";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Documents from "@/pages/Documents";
import Tasks from "@/pages/Tasks";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import Customize from "@/pages/Customize";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      <Route path="/dashboard"><Shell><Dashboard /></Shell></Route>
      <Route path="/chat"><Shell><Chat /></Shell></Route>
      <Route path="/documents"><Shell><Documents /></Shell></Route>
      <Route path="/tasks"><Shell><Tasks /></Shell></Route>
      <Route path="/admin"><Shell><Admin /></Shell></Route>
      <Route path="/profile"><Shell><Profile /></Shell></Route>
      <Route path="/customize"><Shell><Customize /></Shell></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;