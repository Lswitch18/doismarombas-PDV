import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Caixa from "./pages/Caixa";
import Vendas from "./pages/Vendas";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/estoque" element={
            <ProtectedRoute>
              <AppLayout>
                <Estoque />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/caixa" element={
            <ProtectedRoute>
              <AppLayout>
                <Caixa />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/vendas" element={
            <ProtectedRoute>
              <AppLayout>
                <Vendas />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/clientes" element={
            <ProtectedRoute>
              <AppLayout>
                <Clientes />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fornecedores" element={
            <ProtectedRoute>
              <AppLayout>
                <Fornecedores />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute>
              <AppLayout>
                <Relatorios />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <AppLayout>
                <Configuracoes />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
