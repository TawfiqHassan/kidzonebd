import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RotateCcw, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Return {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: string;
  refund_amount: number | null;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    customer_name: string;
    customer_email: string;
    total: number;
  };
}

const AdminReturns: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: returns, isLoading } = useQuery({
    queryKey: ['admin-returns', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select(`
          *,
          order:orders(customer_name, customer_email, total)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Return[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes, resolution }: { 
      id: string; 
      status: string; 
      notes?: string;
      resolution?: string;
    }) => {
      const { error } = await supabase
        .from('returns')
        .update({
          status,
          admin_notes: notes || null,
          resolution: resolution || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success('Return updated');
      setSelectedReturn(null);
      setAdminNotes('');
      setResolution('');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const handleViewReturn = (ret: Return) => {
    setSelectedReturn(ret);
    setAdminNotes(ret.admin_notes || '');
    setResolution(ret.resolution || '');
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedReturn) return;
    updateMutation.mutate({
      id: selectedReturn.id,
      status,
      notes: adminNotes,
      resolution
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      refunded: { variant: 'secondary', label: 'Refunded' }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    pending: returns?.filter(r => r.status === 'pending').length || 0,
    approved: returns?.filter(r => r.status === 'approved').length || 0,
    refunded: returns?.filter(r => r.status === 'refunded').length || 0
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="h-8 w-8" />
          Returns & Refunds
        </h1>
        <p className="text-muted-foreground mt-1">Manage customer return requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Refunded</div>
            <div className="text-2xl font-bold text-blue-500">{stats.refunded}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Return Requests</CardTitle>
            <CardDescription>Review and process customer returns</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : returns && returns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-mono text-sm">
                      #{ret.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ret.order?.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{ret.order?.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{ret.order_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="line-clamp-2 text-sm">{ret.reason}</p>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      ৳{(ret.refund_amount || ret.order?.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(ret.status)}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(ret.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReturn(ret)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No return requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Detail Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Request Details</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedReturn.order?.customer_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order ID</Label>
                  <p className="font-mono">#{selectedReturn.order_id.slice(0, 8)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Refund Amount</Label>
                  <p className="font-bold text-primary">
                    ৳{(selectedReturn.refund_amount || selectedReturn.order?.total || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReturn.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedReturn.reason}</p>
              </div>

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this return..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Resolution Message (visible to customer)</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Message to send to customer..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                {selectedReturn.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus('approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={updateMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus('rejected')}
                      variant="destructive"
                      className="flex-1"
                      disabled={updateMutation.isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedReturn.status === 'approved' && (
                  <Button
                    onClick={() => handleUpdateStatus('refunded')}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={updateMutation.isPending}
                  >
                    Mark as Refunded
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedReturn(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReturns;
