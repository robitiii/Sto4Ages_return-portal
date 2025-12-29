import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
  onPageChange: (page: "auth" | "verify" | "register" | "booking" | "dashboard") => void;
}
import {
  LogOut,
  Package,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Crown,
  Diamond,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard({ onPageChange }: DashboardProps) {
  const { currentUser, bookings, logout, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      onPageChange('auth');
    }
  }, [currentUser, isLoading, onPageChange]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return null;

  const upcomingBookings = bookings && bookings.status === 'confirmed' && new Date(bookings.collectionDate) >= new Date() ? [bookings] : [];
  const pastBookings = bookings && (bookings.status === 'completed' || new Date(bookings.collectionDate) < new Date()) ? [bookings] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{currentUser.fullName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {currentUser.fullName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Manage your storage collections and track your bookings.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - User Info & Package */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{currentUser.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Package Card */}
            <Card
              className={`animate-slide-up ${
                currentUser.package === 'diamond' ? 'package-diamond' : 'package-platinum'
              }`}
              style={{ animationDelay: '100ms' }}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {currentUser.package === 'diamond' ? (
                    <>
                      <Diamond className="w-5 h-5 text-diamond" />
                      Diamond Package
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 text-platinum" />
                      Platinum Package
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {currentUser.package === 'platinum' && !currentUser.customTimeSelected
                    ? 'Free - System assigns collection time'
                    : currentUser.package === 'platinum' && currentUser.customTimeSelected
                    ? 'Paid - Custom time selection enabled'
                    : 'Premium - Full flexibility'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {currentUser.package === 'platinum' && !currentUser.customTimeSelected ? (
                    <div className="space-y-2">
                      <p>Collection days: Mon, Wed, Fri</p>
                      <p className="text-xs italic">
                        Time will be assigned by Sto4ages
                      </p>
                    </div>
                  ) : (
                    <p>Full control over your collection schedule</p>
                  )}
                </div>
                <Button onClick={() => onPageChange('booking')} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Book New Collection
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Bookings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <CardContent className="py-6">
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => onPageChange('booking')} size="lg" className="flex-1 min-w-[200px]">
                    <Calendar className="w-5 h-5" />
                    Book Collection
                  </Button>
                  <Button onClick={() => onPageChange('register')} variant="outline" size="lg" className="flex-1 min-w-[200px]">
                    <Package className="w-5 h-5" />
                    Change Package
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Collections */}
            <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Collections
                </CardTitle>
                <CardDescription>
                  {upcomingBookings.length} scheduled collection{upcomingBookings.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming collections</p>
                    <Button onClick={() => onPageChange('booking')} variant="link" className="mt-2">
                      Book your first collection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {format(new Date(booking.collectionDate), 'EEEE, MMM d')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {booking.isSystemTime ? (
                                <span className="italic">Time to be assigned</span>
                              ) : (
                                <span>{booking.collectionTime}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {booking.penaltyApplied && (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              R{booking.penaltyAmount} penalty
                            </Badge>
                          )}
                          <Badge variant="outline" className={getStatusColor(booking.status)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Collections */}
            {pastBookings.length > 0 && (
              <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                    Past Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(booking.collectionDate), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.collectionTime || 'System time'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
