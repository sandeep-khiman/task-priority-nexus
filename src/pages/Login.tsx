import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const { login, register, isAuthenticated, isLoading, error } = useAuth();
  const { toast } = useToast();
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name, role);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setResetEmailLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setResetEmailLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Reset Your Password
              </CardTitle>
              <CardDescription>
                Enter your email and we'll send you a link to reset your
                password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <Alert className="mb-4">
                  <AlertDescription>
                    If an account with that email exists, we've sent a password
                    reset link. Please check your inbox.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetEmailLoading}
                  >
                    {resetEmailLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="link"
                className="w-full"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetEmailSent(false);
                }}
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Sign in to your account" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your email and password to sign in"
                : "Enter your details to create an account"}
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="team-lead">Team Lead</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Loading..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>

              {isLogin && (
                <Button
                  type="button"
                  variant="link"
                  className="w-full p-0 h-auto font-normal text-sm"
                  onClick={() => setIsForgotPassword(true)}
                >
                  Forgot password?
                </Button>
              )}
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
        {/* Demo login info - This would be removed in a production environment */}
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
          <h3 className="font-medium mb-2">Demo Instructions:</h3>
          <p className="mb-2">
            You can register new accounts with different roles to test the
            functionality.
          </p>
          <p>
            First user to register as admin will have full access to the system.
          </p>
        </div>
      </div>
    </div>
  );
}
