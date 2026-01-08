import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  date: Date;
  time: string;
  partySize: number;
  tableId?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Date;
}

const mockReservations: Reservation[] = [
  {
    id: 'r1',
    customerName: 'John Smith',
    phone: '+1 234 567 8900',
    email: 'john@email.com',
    date: new Date(),
    time: '19:00',
    partySize: 4,
    tableId: 't3',
    status: 'confirmed',
    notes: 'Anniversary dinner, prefer quiet corner',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000),
  },
  {
    id: 'r2',
    customerName: 'Sarah Johnson',
    phone: '+1 234 567 8901',
    date: new Date(),
    time: '20:30',
    partySize: 2,
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 60 * 60000),
  },
  {
    id: 'r3',
    customerName: 'Mike Wilson',
    phone: '+1 234 567 8902',
    email: 'mike@business.com',
    date: new Date(),
    time: '18:00',
    partySize: 6,
    tableId: 't13',
    status: 'seated',
    notes: 'Business dinner',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000),
  },
  {
    id: 'r4',
    customerName: 'Emily Brown',
    phone: '+1 234 567 8903',
    date: new Date(Date.now() + 24 * 60 * 60000),
    time: '19:30',
    partySize: 8,
    status: 'confirmed',
    notes: 'Birthday celebration, need cake',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000),
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  seated: { label: 'Seated', variant: 'success' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  'no-show': { label: 'No Show', variant: 'destructive' },
};

export default function Reservations() {
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'all'>('today');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60000);

  const filteredReservations = mockReservations.filter(res => {
    const matchesSearch = res.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate === 'all' ||
      (selectedDate === 'today' && res.date.toDateString() === today.toDateString()) ||
      (selectedDate === 'tomorrow' && res.date.toDateString() === tomorrow.toDateString());
    return matchesSearch && matchesDate;
  });

  const formatDate = (date: Date) => {
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Reservations</h1>
            <p className="text-muted-foreground mt-1">
              Manage table bookings and waitlist
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Reservation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Today's Bookings</p>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl border border-warning/40 p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">3</p>
          </div>
          <div className="bg-gradient-to-br from-success/20 to-success/5 rounded-xl border border-success/40 p-4">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-success">8</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Guests</p>
            <p className="text-2xl font-bold">42</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex gap-2 mb-4">
          {(['today', 'tomorrow', 'all'] as const).map((filter) => (
            <Button
              key={filter}
              variant={selectedDate === filter ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedDate(filter)}
              className="capitalize"
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Reservations List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              onClick={() => setSelectedReservation(reservation)}
              className={cn(
                'bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50',
                selectedReservation?.id === reservation.id && 'border-primary ring-1 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {reservation.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{reservation.customerName}</h3>
                    <p className="text-sm text-muted-foreground">{reservation.phone}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[reservation.status].variant}>
                  {statusConfig[reservation.status].label}
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(reservation.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{reservation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{reservation.partySize} guests</span>
                </div>
                {reservation.tableId && (
                  <Badge variant="secondary">Table {reservation.tableId.slice(-1)}</Badge>
                )}
              </div>

              {reservation.notes && (
                <p className="mt-3 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2">
                  📝 {reservation.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reservation Detail Panel */}
      {selectedReservation && (
        <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Reservation Details</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedReservation(null)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Customer Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {selectedReservation.customerName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedReservation.customerName}</h3>
                <Badge variant={statusConfig[selectedReservation.status].variant}>
                  {statusConfig[selectedReservation.status].label}
                </Badge>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>{selectedReservation.phone}</span>
              </div>
              {selectedReservation.email && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedReservation.email}</span>
                </div>
              )}
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{formatDate(selectedReservation.date)}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{selectedReservation.time}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Party Size</p>
                <p className="font-semibold">{selectedReservation.partySize} guests</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Table</p>
                <p className="font-semibold">
                  {selectedReservation.tableId ? `Table ${selectedReservation.tableId.slice(-1)}` : 'Not assigned'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedReservation.notes && (
              <div className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedReservation.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            {selectedReservation.status === 'pending' && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="success">
                  <CheckCircle className="w-4 h-4 mr-2" /> Confirm
                </Button>
                <Button variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" /> Decline
                </Button>
              </div>
            )}
            {selectedReservation.status === 'confirmed' && (
              <Button className="w-full">
                <Users className="w-4 h-4 mr-2" /> Mark as Seated
              </Button>
            )}
            {selectedReservation.status === 'seated' && (
              <Button className="w-full" variant="success">
                <CheckCircle className="w-4 h-4 mr-2" /> Complete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
