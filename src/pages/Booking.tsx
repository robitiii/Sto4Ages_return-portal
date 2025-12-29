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
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      onPageChange('auth');
    }
  }, [currentUser, isLoading, onPageChange]);

  const canSelectTime = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.package === 'diamond' || (currentUser.package === 'platinum' && currentUser.customTimeSelected);
  }, [currentUser]);

  const isPlatinumFree = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.package === 'platinum' && !currentUser.customTimeSelected;
  }, [currentUser]);

  const isValidPlatinumDay = (date: Date) => {
    return isMonday(date) || isWednesday(date) || isFriday(date);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Must be in the future
    if (date < today) return true;

    // Must be at least 3 days from now
    if (differenceInDays(date, today) < 3) return true;

    // Platinum free currentUsers can only select Mon, Wed, Fri
    if (isPlatinumFree && !isValidPlatinumDay(date)) return true;

    return false;
  };

  const calculatePenalty = (date: Date): { hasPenalty: boolean; amount: number } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(date, today);

    // 6-3 days = R500 penalty
    if (daysDiff >= 3 && daysDiff <= 6) {
      return { hasPenalty: true, amount: 500 };
    }

    return { hasPenalty: false, amount: 0 };
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = differenceInDays(date, today);

    if (daysDiff < 3) {
      toast.error('Bookings must be made at least 3 days in advance.');
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

    const result = await createBooking({
      id: currentUser.uid,
      tier: currentUser.package === 'platinum' ? 'Gold' : 'Diamond',
      collectionDate: selectedDate.toISOString(),
      collectionTime: canSelectTime ? selectedTime : null,
      isSystemTime: isPlatinumFree,
      penaltyApplied: hasPenalty,
      penaltyAmount: amount,
      status: 'confirmed',
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
                    {isPlatinumFree
                      ? 'Mon, Wed, Fri only • System assigns time'
                      : 'Full flexibility'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onPageChange('register')}>
                Change
              </Button>
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
                {isPlatinumFree
                  ? 'Available: Monday, Wednesday, Friday'
                  : 'Select any available day'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-md border pointer-events-auto"
                fromDate={addDays(new Date(), 3)}
              />
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span>Bookings require 3+ days advance notice</span>
                </div>
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
                {isPlatinumFree ? (
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
                    {isPlatinumFree ? 'To be assigned' : selectedTime || '—'}
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
                  {isPlatinumFree ? 'To be assigned by Sto4ages' : selectedTime}
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
    </div>
  );
}
