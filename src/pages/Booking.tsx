import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingProps {
  onPageChange: (page: "auth" | "verify" | "register" | "booking" | "dashboard") => void;
}
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Crown,
  Diamond,
  Ban,
} from 'lucide-react';
import { format, addDays, differenceInDays, isMonday, isWednesday, isFriday } from 'date-fns';
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

const TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function Booking({ onPageChange }: BookingProps) {
  const { currentUser, createBooking, isLoading } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<'Platinum' | 'Diamond'>('Platinum');
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPackageChangeDialog, setShowPackageChangeDialog] = useState(false);
  const [dropOffAddress, setDropOffAddress] = useState('');
  const [selectedReturnDay, setSelectedReturnDay] = useState<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'>('MON');

  useEffect(() => {
    if (!isLoading && !currentUser) {
      onPageChange('auth');
    }
  }, [currentUser, isLoading, onPageChange]);

  const canSelectTime = useMemo(() => {
    return selectedPackage === 'Diamond';
  }, [selectedPackage]);

  const isSystemTime = useMemo(() => {
    return selectedPackage === 'Platinum';
  }, [selectedPackage]);

  // Check if date is a standard operational day for each package
  const isStandardOperationalDay = (date: Date, packageType: 'Platinum' | 'Diamond') => {
    if (packageType === 'Platinum') {
      // Platinum: Monday & Friday only
      return isMonday(date) || isFriday(date);
    } else if (packageType === 'Diamond') {
      // Diamond: Monday to Friday (standard operational days)
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) to Friday (5)
    }
    return false;
  };

  // Check if Diamond can select this day (including weekends with penalty)
  const isValidDiamondDay = (date: Date) => {
    // Diamond can select any day (Mon-Sun)
    return true;
  };

  // Check if date requires weekend penalty for Diamond package
  const requiresWeekendPenalty = (date: Date) => {
    if (selectedPackage !== 'Diamond') return false;
    
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Must be in the future
    if (date < today) return true;

    // Must be at least 7 days from now (new requirement)
    if (differenceInDays(date, today) < 7) return true;

    // Package-specific day restrictions
    if (selectedPackage === 'Platinum') {
      // Platinum: Monday & Friday only
      return !isStandardOperationalDay(date, 'Platinum');
    } else if (selectedPackage === 'Diamond') {
      // Diamond: Any day allowed (Mon-Sun)
      return !isValidDiamondDay(date);
    }

    return false;
  };

  const calculatePenalty = (date: Date): { hasPenalty: boolean; amount: number } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(date, today);

    // Under 7 days may have penalties (operationally approved)
    if (daysDiff < 7) {
      return { hasPenalty: true, amount: 500 };
    }

    return { hasPenalty: false, amount: 0 };
  };

  const calculateWeekendPenalty = (date: Date): { hasPenalty: boolean; amount: number } => {
    if (selectedPackage !== 'Diamond') return { hasPenalty: false, amount: 0 };
    
    if (requiresWeekendPenalty(date)) {
      return { hasPenalty: true, amount: 200 };
    }

    return { hasPenalty: false, amount: 0 };
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(date, today);

    if (daysDiff < 7) {
      toast.error('Bookings must be made at least 7 days in advance.');
      return;
    }

    setSelectedDate(date);
    setSelectedTime('');

    // Check for penalty
    const { hasPenalty, amount } = calculatePenalty(date);
    if (hasPenalty) {
      setShowPenaltyDialog(true);
    }
  };

  const handleProceed = () => {
    if (!selectedDate) {
      toast.error('Please select a collection date');
      return;
    }

    if (canSelectTime && !selectedTime) {
      toast.error('Please select a collection time');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !currentUser) return;

    const { hasPenalty, amount } = calculatePenalty(selectedDate);
    const { hasPenalty: hasWeekendPenalty, amount: weekendPenaltyAmount } = calculateWeekendPenalty(selectedDate);

    const result = await createBooking({
      id: currentUser.uid,
      tier: currentUser.package === 'platinum' ? 'Gold' : 'Diamond',
      collectionDate: selectedDate.toISOString(),
      collectionTime: canSelectTime ? selectedTime : null,
      isSystemTime: isSystemTime,
      penaltyApplied: hasPenalty,
      penaltyAmount: amount,
      status: 'confirmed',
      // New package system fields
      packageType: selectedPackage,
      allowedReturnDays: selectedPackage === 'Platinum' ? ['MON', 'FRI'] : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      selectedReturnDay: format(selectedDate, 'EEEE').toUpperCase().slice(0, 3) as 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN',
      returnDate: selectedDate.toISOString(),
      returnTime: canSelectTime ? selectedTime : null,
      dropOffAddress: dropOffAddress,
      // Diamond weekend penalty fields
      basePrice: selectedPackage === 'Platinum' ? 0 : 200,
      weekendPenaltyApplied: hasWeekendPenalty,
      weekendPenaltyAmount: weekendPenaltyAmount,
      totalPrice: (selectedPackage === 'Platinum' ? 0 : 200) + weekendPenaltyAmount
    });

    if (result.success) {
      toast.success('Booking confirmed successfully!');
      setShowConfirmDialog(false);
      onPageChange('dashboard');
    } else {
      toast.error(result.error || 'Failed to create booking');
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const { hasPenalty, amount } = selectedDate
    ? calculatePenalty(selectedDate)
    : { hasPenalty: false, amount: 0 };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => onPageChange('dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-3">Book Collection</h1>
          <p className="text-muted-foreground">
            Select your preferred collection date
            {canSelectTime && ' and time'}
          </p>
        </div>

        {/* Package Selector */}
        <Card className="mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle>Select Package</CardTitle>
            <CardDescription>
              Choose your storage package
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="platinum"
                    name="package"
                    value="Platinum"
                    checked={selectedPackage === 'Platinum'}
                    onChange={(e) => setSelectedPackage(e.target.value as 'Platinum' | 'Diamond')}
                    className="w-4 h-4 text-primary"
                  />
                  <Label htmlFor="platinum" className="flex items-center space-x-2 cursor-pointer">
                    <Crown className="w-5 h-5 text-platinum" />
                    <div>
                      <p className="font-semibold">Platinum Package</p>
                      <p className="text-sm text-muted-foreground">Free</p>
                    </div>
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• 2 operating days</p>
                  <p>• Mon And Fri</p>
                  <p>• System-assigned time</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="diamond"
                    name="package"
                    value="Diamond"
                    checked={selectedPackage === 'Diamond'}
                    onChange={(e) => setSelectedPackage(e.target.value as 'Platinum' | 'Diamond')}
                    className="w-4 h-4 text-primary"
                  />
                  <Label htmlFor="diamond" className="flex items-center space-x-2 cursor-pointer">
                    <Diamond className="w-5 h-5 text-diamond" />
                    <div>
                      <p className="font-semibold">Diamond Package</p>
                      <p className="text-sm text-muted-foreground">R200</p>
                    </div>
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• 5 operating days</p>
                  <p>• Monday to Friday</p>
                  <p>• Weekends allowed (+R200)</p>
                  <p>• Choose your time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Package Info */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.package === 'diamond' ? (
                  <Diamond className="w-6 h-6 text-diamond" />
                ) : (
                  <Crown className="w-6 h-6 text-platinum" />
                )}
                <div>
                  <p className="font-semibold">
                    {currentUser.package === 'diamond'
                      ? 'Diamond Package'
                      : 'Platinum Package'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackage === 'Platinum'
                      ? 'Mon And Fri only • System assigns time'
                      : 'Mon-Fri + Weekends (+R200 penalty)'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Select Date
              </CardTitle>
              <CardDescription>
                {selectedPackage === 'Platinum'
                  ? 'Available: Monday & Friday only'
                  : 'Available: Monday-Friday + Weekends (Weekends: +R200)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-md border pointer-events-auto"
                fromDate={addDays(new Date(), 7)}
              />
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span>Bookings require 7+ days advance notice</span>
                </div>
                {selectedPackage === 'Diamond' && selectedDate && requiresWeekendPenalty(selectedDate) && (
                  <div className="flex items-center gap-2 mt-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Weekend selection: +R200 penalty applies</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time & Summary */}
          <div className="space-y-6">
            {/* Time Selection */}
            <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Collection Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSystemTime ? (
                  <div className="p-6 rounded-lg bg-muted/50 text-center">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium text-foreground">System Assigned Time</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll notify you of your collection time
                    </p>
                    <Button variant="link" size="sm" className="mt-2" onClick={() => onPageChange('register')}>
                      Upgrade to choose time
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label>Select Time Slot</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {isSystemTime ? 'To be assigned' : selectedTime || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Package</span>
                  <Badge
                    variant="outline"
                    className={
                      currentUser.package === 'diamond'
                        ? 'bg-diamond/10 text-diamond border-diamond/30'
                        : 'bg-platinum/10 text-platinum border-platinum/30'
                    }
                  >
                    {currentUser.package === 'diamond' ? 'Diamond' : 'Platinum'}
                  </Badge>
                </div>

                {hasPenalty && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-warning flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Late Booking Penalty
                    </span>
                    <span className="font-bold text-warning">R{amount}</span>
                  </div>
                )}

                {/* Drop-off Address - Required for both packages */}
                <div className="space-y-3">
                  <Label>Drop-off Address</Label>
                  <input
                    type="text"
                    value={dropOffAddress}
                    onChange={(e) => setDropOffAddress(e.target.value)}
                    placeholder="Enter your drop-off address"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProceed}
                  disabled={!selectedDate || (canSelectTime && !selectedTime)}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Penalty Warning Dialog */}
      <AlertDialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Late Booking Penalty
            </AlertDialogTitle>
            <AlertDialogDescription>
              This booking is being made 6-3 days before the collection date.
              A <strong className="text-warning">R500 penalty</strong> will be applied
              to your booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDate(undefined)}>
              Choose Different Date
            </AlertDialogCancel>
            <AlertDialogAction className="bg-warning hover:bg-warning/90">
              I Understand, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Booking Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Booking</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please confirm your collection booking:</p>
              <div className="mt-4 p-4 rounded-lg bg-muted space-y-2 text-foreground">
                <p>
                  <strong>Date:</strong>{' '}
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p>
                  <strong>Time:</strong>{' '}
                  {isSystemTime ? 'To be assigned by Sto4ages' : selectedTime}
                </p>
                {hasPenalty && (
                  <p className="text-warning">
                    <strong>Penalty:</strong> R{amount}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBooking}>
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Package Change Dialog */}
      <AlertDialog open={showPackageChangeDialog} onOpenChange={setShowPackageChangeDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Package</AlertDialogTitle>
            <AlertDialogDescription>
              Select your preferred storage package
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="platinum-dialog"
                    name="package-dialog"
                    value="Platinum"
                    checked={selectedPackage === 'Platinum'}
                    onChange={(e) => setSelectedPackage(e.target.value as 'Platinum' | 'Diamond')}
                    className="w-4 h-4 text-primary"
                  />
                  <Label htmlFor="platinum-dialog" className="flex items-center space-x-2 cursor-pointer">
                    <Crown className="w-5 h-5 text-platinum" />
                    <div>
                      <p className="font-semibold">Platinum Package</p>
                      <p className="text-sm text-muted-foreground">Free</p>
                    </div>
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• 2 operating days</p>
                  <p>• Monday & Friday only</p>
                  <p>• System-assigned time</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="diamond-dialog"
                    name="package-dialog"
                    value="Diamond"
                    checked={selectedPackage === 'Diamond'}
                    onChange={(e) => setSelectedPackage(e.target.value as 'Platinum' | 'Diamond')}
                    className="w-4 h-4 text-primary"
                  />
                  <Label htmlFor="diamond-dialog" className="flex items-center space-x-2 cursor-pointer">
                    <Diamond className="w-5 h-5 text-diamond" />
                    <div>
                      <p className="font-semibold">Diamond Package</p>
                      <p className="text-sm text-muted-foreground">R200 + flexible day options</p>
                    </div>
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• 3 standard operating days</p>
                  <p>• Mon, Wed, Fri (standard)</p>
                  <p>• Tue, Thu (with +R200 surcharge)</p>
                  <p>• Choose your time</p>
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowPackageChangeDialog(false)}>
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
