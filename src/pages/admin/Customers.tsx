import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, User, Pencil, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  username: string | null;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
}

const AdminCustomers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    username: ''
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Exclude admins from the customer list
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      const adminIds = new Set((roles || []).filter((r) => r.role === 'admin').map((r) => r.user_id));
      const customerProfiles = (profiles || []).filter((p) => !adminIds.has(p.user_id));

      // Get order stats for each customer
      const customersWithStats = await Promise.all(
        customerProfiles.map(async (profile) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            orders_count: orders?.length || 0,
            total_spent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
          };
        })
      );

      return customersWithStats as Customer[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: Partial<Customer> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data.updates)
        .eq('user_id', data.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Call edge function to properly delete user from auth system
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Customer deleted completely');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (customers && selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else if (customers) {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!customers || customers.length === 0) {
      toast.error('No customers to export');
      return;
    }

    const customersToExport = selectedCustomers.length > 0
      ? customers.filter(c => selectedCustomers.includes(c.id))
      : customers;

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'City', 'Username', 'Joined Date', 'Orders Count', 'Total Spent'];

    const rows = customersToExport.map(customer => [
      customer.id,
      customer.full_name || '',
      customer.email || '',
      customer.phone || '',
      customer.city || '',
      customer.username || '',
      format(new Date(customer.created_at), 'yyyy-MM-dd'),
      customer.orders_count || 0,
      customer.total_spent || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${customersToExport.length} customers`);
  };

  // Get customer tier based on total spent
  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 50000) return { label: 'VIP', color: 'bg-yellow-500/20 text-yellow-500' };
    if (totalSpent >= 20000) return { label: 'Premium', color: 'bg-purple-500/20 text-purple-500' };
    if (totalSpent >= 5000) return { label: 'Regular', color: 'bg-blue-500/20 text-blue-500' };
    return { label: 'New', color: 'bg-muted text-muted-foreground' };
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
      username: customer.username || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingCustomer) return;
    updateMutation.mutate({
      userId: editingCustomer.user_id,
      updates: {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        city: editForm.city,
        username: editForm.username
      }
    });
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">View and manage customers</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV {selectedCustomers.length > 0 && `(${selectedCustomers.length})`}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Info */}
      {selectedCustomers.length > 0 && (
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium">{selectedCustomers.length} selected</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomers([])}>
            Clear
          </Button>
        </div>
      )}

      {/* Customers Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={customers && customers.length > 0 && selectedCustomers.length === customers.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : customers && customers.length > 0 ? (
              customers.map((customer) => {
                const tier = getCustomerTier(customer.total_spent || 0);
                return (
                  <TableRow key={customer.id} className={selectedCustomers.includes(customer.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => toggleSelectCustomer(customer.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.full_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.city || '-'}</TableCell>
                    <TableCell>
                      <Badge className={tier.color}>{tier.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
                    <TableCell>{customer.orders_count}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatPrice(customer.total_spent || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {customer.full_name || customer.email}'s profile. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(customer.user_id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
