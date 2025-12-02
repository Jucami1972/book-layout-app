import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewProject from "./pages/NewProject";
import ProjectEditor from "./pages/ProjectEditor";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookWizard from "./pages/BookWizard";
import BookEditor from "./pages/BookEditor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/book/new" component={BookWizard} />
      <Route path="/book/:id/edit" component={BookEditor} />
      <Route path="/project/new" component={NewProject} />
      <Route path="/project/:id" component={ProjectEditor} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
