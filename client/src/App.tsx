import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from './contexts/ThemeContext';
import { CementAppRoutes } from './pages/cement';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <CementAppRoutes />
      </TooltipProvider>
    </ThemeProvider>
  );
}
