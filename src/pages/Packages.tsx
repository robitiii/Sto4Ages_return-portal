import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Crown,
  Diamond,
  Check,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Packages() {
  const { user, updateUserPackage, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<'platinum' | 'diamond'>('platinum');
  const [customTimeEnabled, setCustomTimeEnabled] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [complianceAccepted, setComplianceAccepted] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (user) {
      setSelectedPackage(user.package);
      setCustomTimeEnabled(user.customTimeSelected);
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const platinumFeatures = [
    { text: 'Collection on Mon, Wed, Fri', included: true },
    { text: 'System-assigned time', included: true },
    { text: 'Secure storage', included: true },
    { text: 'Campus pickup', included: true },
  ];

  const diamondFeatures = [
    { text: 'Collection any day', included: true },
    { text: 'Choose your own time', included: true },
    { text: 'Priority handling', included: true },
    { text: 'Secure storage', included: true },
    { text: 'Campus pickup', included: true },
  ];

  const handleSelectPackage = () => {
    if (selectedPackage === 'platinum' && !customTimeEnabled && !complianceAccepted) {
      toast.error('Please accept the compliance disclaimer to continue');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSelection = () => {
    updateUserPackage(selectedPackage, customTimeEnabled);
    toast.success(
      selectedPackage === 'diamond'
        ? 'Upgraded to Diamond Package!'
        : customTimeEnabled
        ? 'Platinum with custom time enabled!'
        : 'Platinum Package selected!'
    );
    setShowConfirmDialog(false);
    navigate('/dashboard');
  };

  const getPrice = () => {
    if (selectedPackage === 'diamond') return 'R299/month';
    if (customTimeEnabled) return 'R99/month';
    return 'Free';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-3">Choose Your Package</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select the package that best fits your storage needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Platinum Package */}
          <Card
            className={`cursor-pointer transition-all duration-300 animate-slide-up ${
              selectedPackage === 'platinum'
                ? 'package-platinum ring-2 ring-platinum shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedPackage('platinum')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full bg-platinum/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-platinum" />
              </div>
              <CardTitle className="text-2xl">Platinum</CardTitle>
              <CardDescription>Perfect for students on a budget</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">
                  {selectedPackage === 'platinum' && customTimeEnabled ? 'R99' : 'Free'}
                </span>
                {selectedPackage === 'platinum' && customTimeEnabled && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
              {user.package === 'platinum' && (
                <Badge className="mt-2 bg-platinum/20 text-platinum border-platinum/30">
                  Current Plan
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {platinumFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-platinum" />
                    <span className="text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {selectedPackage === 'platinum' && (
                <div className="mt-6 pt-6 border-t border-border space-y-4 animate-fade-in">
                  {/* Custom Time Upgrade Option */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <Checkbox
                      id="customTime"
                      checked={customTimeEnabled}
                      onCheckedChange={(checked) => setCustomTimeEnabled(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="customTime" className="font-medium cursor-pointer">
                        Enable Custom Time Selection (+R99/month)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Choose your own collection time instead of system-assigned
                      </p>
                    </div>
                  </div>

                  {/* Compliance Disclaimer */}
                  {!customTimeEnabled && (
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Compliance Disclaimer</p>
                          <p className="text-xs text-muted-foreground">
                            Sto4ages will assign the collection time. You are required to be
                            available at the communicated time.
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Checkbox
                              id="compliance"
                              checked={complianceAccepted}
                              onCheckedChange={(checked) => setComplianceAccepted(checked as boolean)}
                            />
                            <Label htmlFor="compliance" className="text-xs cursor-pointer">
                              I understand and accept
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diamond Package */}
          <Card
            className={`cursor-pointer transition-all duration-300 animate-slide-up ${
              selectedPackage === 'diamond'
                ? 'package-diamond ring-2 ring-diamond shadow-lg'
                : 'hover:shadow-md'
            }`}
            style={{ animationDelay: '100ms' }}
            onClick={() => setSelectedPackage('diamond')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full bg-diamond/20 flex items-center justify-center mx-auto mb-4">
                <Diamond className="w-8 h-8 text-diamond" />
              </div>
              <CardTitle className="text-2xl">Diamond</CardTitle>
              <CardDescription>Full flexibility & priority service</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">R299</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {user.package === 'diamond' && (
                <Badge className="mt-2 bg-diamond/20 text-diamond border-diamond/30">
                  Current Plan
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {diamondFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-diamond" />
                    <span className="text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {selectedPackage === 'diamond' && (
                <div className="mt-6 pt-6 border-t border-border animate-fade-in">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-diamond/10">
                    <Calendar className="w-5 h-5 text-diamond" />
                    <span className="text-sm">Book any day of the week</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-diamond/10 mt-2">
                    <Clock className="w-5 h-5 text-diamond" />
                    <span className="text-sm">Select exact time slots</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selection Summary */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected Package</p>
                <p className="text-xl font-bold">
                  {selectedPackage === 'diamond'
                    ? 'Diamond'
                    : customTimeEnabled
                    ? 'Platinum (Custom Time)'
                    : 'Platinum (Free)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-primary">{getPrice()}</p>
              </div>
              <Button size="lg" onClick={handleSelectPackage} className="min-w-[150px]">
                {user.package === selectedPackage && user.customTimeSelected === customTimeEnabled
                  ? 'Current Plan'
                  : 'Select Package'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Package Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You are selecting the{' '}
              <strong>
                {selectedPackage === 'diamond'
                  ? 'Diamond'
                  : customTimeEnabled
                  ? 'Platinum (Custom Time)'
                  : 'Platinum (Free)'}
              </strong>{' '}
              package at <strong>{getPrice()}</strong>.
              {selectedPackage === 'diamond' || customTimeEnabled
                ? ' Payment will be processed separately.'
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelection}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
