import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Diamond, Crown, Mail, Phone, MapPin, Clock, AlertCircle, X, LogOut, Download } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

interface BookingData {
  packageType: 'Platinum' | 'Diamond';
  allowedReturnDays: string[];
  selectedReturnDay: string;
  returnDate: string;
  returnTime: string | null;
  dropOffAddress: string;
  basePrice: number;
  currency: string;
  weekendPenaltyApplied: boolean;
  weekendPenaltyAmount: number;
  totalPrice: number;
  paymentStatus: string;
  createdAt: any;
  penaltyApplied: boolean;
  penaltyAmount: number;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
}

interface BookingWithUser extends BookingData {
  uid: string;
  user: UserData;
}

interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  days: {
    [key: string]: {
      diamond: BookingWithUser[];
      platinum: BookingWithUser[];
    };
  };
}

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export error states
  const [bookingsExportError, setBookingsExportError] = useState(false);
  const [cashInExportError, setCashInExportError] = useState(false);

  // Filter states
  const [dateDimension, setDateDimension] = useState<'createdAt' | 'returnDate'>('returnDate');
  const [datePreset, setDatePreset] = useState<'today' | 'thisWeek' | 'next7Days' | 'thisMonth' | 'custom'>('custom');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [packageFilter, setPackageFilter] = useState<'all' | 'Platinum' | 'Diamond'>('all');

  useEffect(() => {
    // Guard against auth state not being ready
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const checkAdminAccess = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data() as UserData;
        
        if (!userData?.isAdmin) {
          return; // Don't load admin data if not admin
        }

        await fetchBookings();
      } catch (err) {
        console.error('Admin access check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [currentUser]);

  // Calculate preset date ranges
  const getPresetDateRange = (preset: typeof datePreset) => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        return {
          start: startOfDay(today),
          end: endOfDay(today)
        };
      
      case 'thisWeek':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = addDays(weekStart, 6); // Sunday
        return {
          start: startOfDay(weekStart),
          end: endOfDay(weekEnd)
        };
      
      case 'next7Days':
        return {
          start: startOfDay(today),
          end: endOfDay(addDays(today, 7))
        };
      
      case 'thisMonth':
        return {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
      
      case 'custom':
      default:
        return { start: startDate, end: endDate };
    }
  };

  // Handle preset changes
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    
    if (preset !== 'custom') {
      const range = getPresetDateRange(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  // Handle manual date changes
  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    
    // Auto-switch to custom preset when dates are manually changed
    if (datePreset !== 'custom') {
      setDatePreset('custom');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setDateDimension('returnDate');
    setDatePreset('custom');
    setStartDate(undefined);
    setEndDate(undefined);
    setPackageFilter('all');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // CSV Export Functions
  const generateCSV = (data: any[], filename: string, exportType: 'bookings' | 'cashIn') => {
    if (data.length === 0) {
      // Set appropriate error state based on export type
      if (exportType === 'bookings') {
        setBookingsExportError(true);
        setTimeout(() => setBookingsExportError(false), 5000);
      } else {
        setCashInExportError(true);
        setTimeout(() => setCashInExportError(false), 5000);
      }
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWeeklyBookings = () => {
    const filteredBookings = getFilteredBookings();
    
    // Transform bookings for CSV export
    const csvData = filteredBookings.map(booking => ({
      'Booking ID': booking.uid,
      'Customer Name': booking.user.name,
      'Customer Email': booking.user.email,
      'Customer Phone': booking.user.phone,
      'Package Type': booking.packageType,
      'Return Date': format(parseISO(booking.returnDate), 'yyyy-MM-dd'),
      'Return Day': booking.selectedReturnDay,
      'Return Time': booking.returnTime || 'System Assigned',
      'Drop-off Address': booking.dropOffAddress,
      'Price': `R${booking.basePrice}`,
      'Payment Status': booking.paymentStatus,
      'Penalty Applied': booking.penaltyApplied ? 'Yes' : 'No',
      'Penalty Amount': booking.penaltyApplied ? `R${booking.penaltyAmount}` : 'R0',
      'Weekend Penalty Applied': booking.weekendPenaltyApplied ? 'Yes' : 'No',
      'Weekend Penalty Amount': booking.weekendPenaltyApplied ? `R${booking.weekendPenaltyAmount}` : 'R0',
      'Total Price': `R${booking.totalPrice}`,
      'Created Date': booking.createdAt ? format(booking.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'
    }));

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const filename = `weekly-bookings-${format(weekStart, 'yyyy-MM-dd')}.csv`;
    generateCSV(csvData, filename, 'bookings');
  };

  const exportWeeklyCashIn = () => {
    const filteredBookings = getFilteredBookings();
    
    // Calculate cash-in data
    const cashInData = filteredBookings.map(booking => {
      const totalRevenue = booking.totalPrice;
      const penaltyRevenue = booking.penaltyApplied ? booking.penaltyAmount : 0;
      const weekendPenaltyRevenue = booking.weekendPenaltyApplied ? booking.weekendPenaltyAmount : 0;
      
      return {
        'Booking ID': booking.uid,
        'Customer Name': booking.user.name,
        'Package Type': booking.packageType,
        'Return Date': format(parseISO(booking.returnDate), 'yyyy-MM-dd'),
        'Base Price': `R${booking.basePrice}`,
        'Penalty Revenue': `R${penaltyRevenue}`,
        'Weekend Penalty Revenue': `R${weekendPenaltyRevenue}`,
        'Total Revenue': `R${totalRevenue}`,
        'Payment Status': booking.paymentStatus,
        'Created Date': booking.createdAt ? format(booking.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'
      };
    });

    // Add summary row
    const totalBaseRevenue = cashInData.reduce((sum, item) => {
      const basePrice = parseInt(item['Base Price'].replace(/[R,]/g, ''));
      return sum + basePrice;
    }, 0);
    
    const totalPenaltyRevenue = cashInData.reduce((sum, item) => {
      const penaltyPrice = parseInt(item['Penalty Revenue'].replace(/[R,]/g, ''));
      return sum + penaltyPrice;
    }, 0);
    
    const totalWeekendPenaltyRevenue = cashInData.reduce((sum, item) => {
      const weekendPenaltyPrice = parseInt(item['Weekend Penalty Revenue'].replace(/[R,]/g, ''));
      return sum + weekendPenaltyPrice;
    }, 0);
    
    const grandTotal = cashInData.reduce((sum, item) => {
      const total = parseInt(item['Total Revenue'].replace(/[R,]/g, ''));
      return sum + total;
    }, 0);

    cashInData.push({
      'Booking ID': 'TOTAL',
      'Customer Name': '',
      'Package Type': '' as 'Platinum' | 'Diamond',
      'Return Date': '',
      'Base Price': `R${totalBaseRevenue}`,
      'Penalty Revenue': `R${totalPenaltyRevenue}`,
      'Weekend Penalty Revenue': `R${totalWeekendPenaltyRevenue}`,
      'Total Revenue': `R${grandTotal}`,
      'Payment Status': '',
      'Created Date': ''
    });

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const filename = `weekly-cash-in-${format(weekStart, 'yyyy-MM-dd')}.csv`;
    generateCSV(cashInData, filename, 'cashIn');
  };

  // Apply filters to bookings
  const getFilteredBookings = () => {
    let filtered = [...bookings];
    
    // Apply date filter
    if (startDate || endDate) {
      filtered = filtered.filter(booking => {
        const dateField = dateDimension === 'createdAt' ? booking.createdAt : booking.returnDate;
        const bookingDate = dateField ? (typeof dateField === 'string' ? parseISO(dateField) : dateField.toDate()) : null;
        
        if (!bookingDate) return false;
        
        if (startDate && bookingDate < startDate) return false;
        if (endDate && bookingDate > endDate) return false;
        
        return true;
      });
    }
    
    // Apply package filter
    if (packageFilter !== 'all') {
      filtered = filtered.filter(booking => booking.packageType === packageFilter);
    }
    
    return filtered;
  };

  const fetchBookings = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Query upcoming bookings only
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('returnDate', '>=', today.toISOString()),
        orderBy('returnDate', 'asc')
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData: BookingWithUser[] = [];

      for (const bookingDoc of bookingsSnapshot.docs) {
        const bookingData = bookingDoc.data() as BookingData;
        const uid = bookingDoc.id;

        // Fetch corresponding user profile
        const userDoc = await getDoc(doc(db, 'users', uid));
        const userData = userDoc.data() as UserData || {
          name: 'Unknown',
          email: 'Not provided',
          phone: 'Not provided',
          isAdmin: false
        };

        bookingsData.push({
          ...bookingData,
          uid,
          user: userData
        });
      }

      setBookings(bookingsData);
    } catch (err) {
      console.error('Admin bookings fetch error:', err);
      setError('Failed to load bookings');
    }
  };

  const groupBookingsByWeek = (): WeekGroup[] => {
    const filteredBookings = getFilteredBookings();
    if (filteredBookings.length === 0) return [];

    const weekGroups: { [key: string]: WeekGroup } = {};
    
    // First pass: collect all bookings by week and check for weekend bookings
    const weekendBookingWeeks = new Set<string>();
    
    filteredBookings.forEach(booking => {
      const returnDate = parseISO(booking.returnDate);
      const weekStart = startOfWeek(returnDate, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const dayName = format(returnDate, 'EEEE');
      
      // Check if this is a weekend booking
      if (dayName === 'Saturday' || dayName === 'Sunday') {
        weekendBookingWeeks.add(weekKey);
      }
    });

    // Second pass: create week groups with appropriate days
    filteredBookings.forEach(booking => {
      const returnDate = parseISO(booking.returnDate);
      const weekStart = startOfWeek(returnDate, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weekGroups[weekKey]) {
        // Always include weekdays
        const days: WeekGroup['days'] = {
          Monday: { diamond: [], platinum: [] },
          Tuesday: { diamond: [], platinum: [] },
          Wednesday: { diamond: [], platinum: [] },
          Thursday: { diamond: [], platinum: [] },
          Friday: { diamond: [], platinum: [] }
        };
        
        // Add weekend days only if bookings exist for this week
        if (weekendBookingWeeks.has(weekKey)) {
          days.Saturday = { diamond: [], platinum: [] };
          days.Sunday = { diamond: [], platinum: [] };
        }
        
        weekGroups[weekKey] = {
          weekStart,
          weekEnd: addDays(weekStart, 6),
          days
        };
      }

      const dayName = format(returnDate, 'EEEE');
      const weekGroup = weekGroups[weekKey];
      
      if (weekGroup.days[dayName]) {
        if (booking.packageType === 'Diamond') {
          weekGroup.days[dayName].diamond.push(booking);
        } else {
          weekGroup.days[dayName].platinum.push(booking);
        }
      }
    });

    // Sort within each day: Diamond by time, then Platinum
    Object.values(weekGroups).forEach(weekGroup => {
      Object.values(weekGroup.days).forEach(day => {
        day.diamond.sort((a, b) => {
          if (!a.returnTime) return 1;
          if (!b.returnTime) return -1;
          return a.returnTime.localeCompare(b.returnTime);
        });
        // Platinum bookings don't have times, sort by name
        day.platinum.sort((a, b) => a.user.name.localeCompare(b.user.name));
      });
    });

    return Object.values(weekGroups).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  };

  if (!currentUser) return null;

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data() as UserData;
        setIsAdmin(userData?.isAdmin || false);
      } catch (err) {
        console.error('Admin check error:', err);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [currentUser]);

  if (isAdmin === false) {
    return null; // Don't render anything for non-admins
  }

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const weekGroups = groupBookingsByWeek();

  // Guard against rendering when auth is not ready
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Monitor upcoming bookings and user contact details
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col">
              <Button variant="outline" onClick={exportWeeklyBookings} className="flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Bookings</span>
                <span className="sm:hidden">Bookings</span>
              </Button>
              {bookingsExportError && (
                <div className="text-xs text-orange-600 mt-1">
                  No data available to export for the selected period.
                  <div className="text-xs text-orange-500 mt-1">
                    Please adjust date range and try again.
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <Button variant="outline" onClick={exportWeeklyCashIn} className="flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Cash-In</span>
                <span className="sm:hidden">Cash-In</span>
              </Button>
              {cashInExportError && (
                <div className="text-xs text-orange-600 mt-1">
                  No data available to export for the selected period.
                  <div className="text-xs text-orange-500 mt-1">
                    Please adjust date range and try again.
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Date Dimension */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Type</label>
                <Select value={dateDimension} onValueChange={(value: 'createdAt' | 'returnDate') => setDateDimension(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="returnDate">Return / Delivery Date</SelectItem>
                    <SelectItem value="createdAt">Booking Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Preset */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={datePreset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="next7Days">Next 7 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <input
                  type="date"
                  value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('start', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  disabled={datePreset !== 'custom'}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <input
                  type="date"
                  value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('end', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  disabled={datePreset !== 'custom'}
                />
              </div>

              {/* Package Filter & Clear */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Package</label>
                  <Select value={packageFilter} onValueChange={(value: 'all' | 'Platinum' | 'Diamond') => setPackageFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="Diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={clearFilters} className="px-3">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getFilteredBookings().length}</div>
              <p className="text-xs text-muted-foreground">Upcoming returns</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Diamond className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Diamond</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getFilteredBookings().filter(b => b.packageType === 'Diamond').length}
              </div>
              <p className="text-xs text-muted-foreground">Time-specific returns</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Platinum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getFilteredBookings().filter(b => b.packageType === 'Platinum').length}
              </div>
              <p className="text-xs text-muted-foreground">Manual coordination</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-medium">Late Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getFilteredBookings().filter(b => b.penaltyApplied).length}
              </div>
              <p className="text-xs text-muted-foreground">
                R{getFilteredBookings().filter(b => b.penaltyApplied).reduce((sum, b) => sum + b.penaltyAmount, 0)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-medium">Weekend Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getFilteredBookings().filter(b => b.weekendPenaltyApplied).length}
              </div>
              <p className="text-xs text-muted-foreground">
                R{getFilteredBookings().filter(b => b.weekendPenaltyApplied).reduce((sum, b) => sum + b.weekendPenaltyAmount, 0)} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Bookings */}
        {getFilteredBookings().length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {bookings.length === 0 ? 'No Upcoming Bookings' : 'No Bookings Found'}
              </h3>
              <p className="text-muted-foreground">
                {bookings.length === 0 
                  ? 'No bookings scheduled for the coming weeks.' 
                  : 'No bookings found for the selected period and filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {weekGroups.map((weekGroup, weekIndex) => (
              <Card key={weekIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Week of {format(weekGroup.weekStart, 'MMM d')} - {format(weekGroup.weekEnd, 'MMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.keys(weekGroup.days).map(dayName => {
                    const dayData = weekGroup.days[dayName];
                    const hasBookings = dayData.diamond.length > 0 || dayData.platinum.length > 0;
                    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
                    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(dayName);
                    
                    return (
                      <div key={dayName} className={`border-l-4 pl-4 ${isWeekend ? 'border-orange-300 bg-orange-50/30 -mx-2 px-2' : 'border-muted'}`}>
                        <h4 className={`font-semibold text-lg mb-3 ${isWeekend ? 'text-orange-800' : ''}`}>
                          📅 {dayName}{isWeekend && ' (Weekend)'} — {format(addDays(weekGroup.weekStart, dayIndex), 'MMM d, yyyy')}
                          {isWeekend && (
                            <span className="ml-2 text-sm text-orange-600 font-normal">
                              Weekend booking — R200 penalty applies
                            </span>
                          )}
                        </h4>
                        
                        {!hasBookings ? (
                          <p className="text-muted-foreground italic">No returns scheduled</p>
                        ) : (
                          <div className="space-y-4">
                            {/* Diamond Bookings */}
                            {dayData.diamond.length > 0 && (
                              <div>
                                <h5 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                                  💎 Diamond
                                </h5>
                                <div className="space-y-3">
                                  {dayData.diamond.map((booking) => (
                                    <div key={booking.uid} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="font-semibold">{booking.user.name}</p>
                                          <p className="text-sm text-blue-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {booking.returnTime || 'Time not specified'}
                                          </p>
                                        </div>
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                          R{booking.price}
                                        </Badge>
                                      </div>
                                      {booking.penaltyApplied && (
                                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                          <p className="text-orange-600 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Late Booking Penalty: R{booking.penaltyAmount}
                                          </p>
                                        </div>
                                      )}
                                      {booking.weekendPenaltyApplied && (
                                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                          <p className="text-orange-600 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Weekend Penalty: R{booking.weekendPenaltyAmount}
                                          </p>
                                        </div>
                                      )}
                                      <div className="space-y-1 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2">
                                          <Mail className="w-3 h-3" />
                                          {booking.user.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <Phone className="w-3 h-3" />
                                          {booking.user.phone}
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <MapPin className="w-3 h-3" />
                                          {booking.dropOffAddress}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Platinum Bookings */}
                            {dayData.platinum.length > 0 && (
                              <div>
                                <h5 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                                  🟡 Platinum
                                </h5>
                                <div className="space-y-3">
                                  {dayData.platinum.map((booking) => (
                                    <div key={booking.uid} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="font-semibold">{booking.user.name}</p>
                                          <p className="text-sm text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Manual coordination required
                                          </p>
                                        </div>
                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                          R{booking.price}
                                        </Badge>
                                      </div>
                                      {booking.penaltyApplied && (
                                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                          <p className="text-orange-600 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Late Booking Penalty: R{booking.penaltyAmount}
                                          </p>
                                        </div>
                                      )}
                                      {booking.weekendPenaltyApplied && (
                                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                          <p className="text-orange-600 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Weekend Penalty: R{booking.weekendPenaltyAmount}
                                          </p>
                                        </div>
                                      )}
                                      <div className="space-y-1 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2">
                                          <Mail className="w-3 h-3" />
                                          {booking.user.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <Phone className="w-3 h-3" />
                                          {booking.user.phone}
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <MapPin className="w-3 h-3" />
                                          {booking.dropOffAddress}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-600">Error loading bookings: {error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
