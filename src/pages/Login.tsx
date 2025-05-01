
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, isAuthenticated, isLoading, error } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      
      if (!error) {
        toast({
          title: isLogin ? 'Logged in successfully' : 'Account created successfully',
          description: isLogin ? 'Welcome back!' : 'Welcome to Task Priority Nexus!',
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Sign in to your account' : 'Create an account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your email and password to sign in' : 'Enter your details to create an account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="demo@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? 'Loading...' 
                  : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              variant="link" 
              className="w-full" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </Card>
        {/* Demo login info */}
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
          <h3 className="font-medium mb-2">Demo Accounts:</h3>
          <ul className="space-y-1">
            <li>Admin: admin@example.com / password</li>
            <li>Manager: manager@example.com / password</li>
            <li>Team Lead: teamlead@example.com / password</li>
            <li>Employee: employee@example.com / password</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
