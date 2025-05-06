
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CheckCircle, AlertCircle, KeyRound, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const { toast } = useToast();

  // Check if we're on the reset page with a token
  useState(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setMode('reset');
    }
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Please enter your email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetSent(true);
      toast({
        title: 'Reset link sent',
        description: 'Check your email for the password reset link',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
      toast({
        title: 'Reset failed',
        description: err.message || 'Failed to send reset link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!newPassword.trim()) {
        throw new Error('Please enter a new password');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Password updated',
        description: 'Your password has been reset successfully',
      });

      // Redirect to login after successful reset
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      toast({
        title: 'Reset failed',
        description: err.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestForm = () => (
    <form onSubmit={handleRequestReset}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={isLoading || resetSent}
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resetSent && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Password reset link has been sent to your email address. Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading || resetSent}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : resetSent ? (
            'Link Sent'
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </div>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handleResetPassword}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex justify-center items-center">
              <KeyRound className="h-6 w-6 mr-2" />
              {mode === 'request' ? 'Reset Password' : 'Set New Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'request'
                ? 'Enter your email to receive a password reset link'
                : 'Enter your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'request' ? renderRequestForm() : renderResetForm()}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Return to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
