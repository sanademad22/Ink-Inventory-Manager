import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as Sonner } from 'sonner';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

import Dashboard from '@/pages/dashboard';
import InventoryList from '@/pages/inventory/list';
import InventoryForm from '@/pages/inventory/form';
import EmployeeList from '@/pages/employees/list';
import EmployeeForm from '@/pages/employees/form';
import EmployeeDetail from '@/pages/employees/detail';
import TransactionList from '@/pages/transactions/list';
import TransactionForm from '@/pages/transactions/form';
import UsersList from '@/pages/users/index';
import UsersForm from '@/pages/users/form';
import Login from '@/pages/login';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0f1e]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={InventoryList} />
      <Route path="/inventory/new" component={InventoryForm} />
      <Route path="/inventory/:id/edit" component={InventoryForm} />
      <Route path="/employees" component={EmployeeList} />
      <Route path="/employees/new" component={EmployeeForm} />
      <Route path="/employees/:id" component={EmployeeDetail} />
      <Route path="/employees/:id/edit" component={EmployeeForm} />
      <Route path="/transactions" component={TransactionList} />
      <Route path="/transactions/new" component={TransactionForm} />
      
      {user.role === 'admin' && <Route path="/users" component={UsersList} />}
      {user.role === 'admin' && <Route path="/users/new" component={UsersForm} />}
      {user.role === 'admin' && <Route path="/users/:id/edit" component={UsersForm} />}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
        <Sonner position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
