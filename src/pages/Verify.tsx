import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface VerifyProps {
  onPageChange: (page: "auth" | "verify" | "register" | "booking" | "dashboard") => void;
}

export default function Verify({ onPageChange }: VerifyProps) {
  const { currentUser, resendVerificationEmail, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleResendEmail = async () => {
    setIsLoading(true);
    const result = await resendVerificationEmail();
    if (result.success) {
      toast.success('Verification email sent! Please check your inbox.');
    } else {
      toast.error(result.error || 'Failed to send verification email.');
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    onPageChange('auth');
  };

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
        <div className="animate-fade-in">
          <Logo size="lg" className="mb-8 [&_span]:text-primary-foreground [&_div]:bg-secondary [&_svg]:text-primary" />
          <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Verify Your
            <br />
            Email Address
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-md">
            We've sent a verification link to your email. Click the link to activate your account and start booking.
          </p>
        </div>
      </div>

      {/* Right Side - Verification */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md glass-card animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden mb-4">
              <Logo size="md" className="justify-center" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to
              <br />
              <span className="font-semibold text-foreground">{currentUser?.email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Click the verification link in your email to activate your account. If you don't see it, check your spam folder.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Email
                  </>
                )}
              </Button>

              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                I've Verified My Email
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Wrong email? 
                <button
                  onClick={handleLogout}
                  className="ml-1 text-primary font-semibold hover:underline"
                >
                  Sign out and try again
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
