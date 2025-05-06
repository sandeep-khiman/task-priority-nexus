
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Manage your team's tasks with ease
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                A collaborative task management platform designed for teams of all sizes. 
                Delegate, track, and complete tasks efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/login')} asChild>
                  <a>Get Started</a>
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')} asChild>
                  <a>Log In</a>
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mr-2">✓</span>
                  Team hierarchy management
                </li>
                <li className="flex items-center">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mr-2">✓</span>
                  Task delegation and tracking
                </li>
                <li className="flex items-center">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mr-2">✓</span>
                  Role-based permissions
                </li>
                <li className="flex items-center">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mr-2">✓</span>
                  Multi-team membership
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
