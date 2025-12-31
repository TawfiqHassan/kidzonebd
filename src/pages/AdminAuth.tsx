import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const AdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, signIn, resetPassword, isLoading } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user && isAdmin && !isLoading) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset') {
      toast.info('You can now set a new password');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
      return;
    }
    
    // Will redirect via useEffect once isAdmin is confirmed
    toast.success('Welcome, Admin!');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail.trim() || !z.string().email().safeParse(forgotEmail).success) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await resetPassword(forgotEmail);
    setIsSubmitting(false);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    setResetSent(true);
    toast.success('Password reset email sent!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in but not admin
  if (user && !isAdmin && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-dark via-brand-slate to-gray-900 p-4">
        <Card className="w-full max-w-md border-red-500/50 bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-500">Access Denied</CardTitle>
            <CardDescription className="text-base">
              You don't have administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium">{user.email}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Customer Login
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-brand-dark to-brand-slate p-4">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block">
          <img src={logo} alt="TiqBud" className="h-16 w-auto mx-auto" />
        </Link>
        <div className="mt-4 flex items-center justify-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <span className="text-lg font-semibold">Admin Portal</span>
        </div>
      </div>
      
      <Card className="w-full max-w-md border-primary/30 bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Admin Login' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Sign in to access the admin dashboard' 
              : 'Enter your admin email to reset password'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@tiqbud.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-border/50 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="border-border/50 focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In to Admin'}
              </Button>
              
              <Button
                type="button"
                variant="link"
                className="w-full text-muted-foreground"
                onClick={() => setMode('forgot')}
              >
                Forgot your password?
              </Button>
            </form>
          ) : resetSent ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Check your email</h3>
              <p className="text-muted-foreground text-sm mb-4">
                We've sent a password reset link to {forgotEmail}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setMode('login');
                  setResetSent(false);
                  setForgotEmail('');
                }}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Admin Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="admin@tiqbud.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
              
              <Button
                type="button"
                variant="link"
                className="w-full text-muted-foreground"
                onClick={() => setMode('login')}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-6 text-sm text-muted-foreground">
        Not an admin? <Link to="/auth" className="text-primary hover:underline">Customer Login</Link>
      </p>
    </div>
  );
};

export default AdminAuth;
