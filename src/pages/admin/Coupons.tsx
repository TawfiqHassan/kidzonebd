import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Tag, Percent, DollarSign } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

const AdminCoupons: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: 0,
    max_uses: '',
    is_active: true,
    valid_until: ''
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        is_active: data.is_active,
        valid_until: data.valid_until || null
      };

      if (data.id) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon status updated');
    }
  });

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_amount: 0,
      max_uses: '',
      is_active: true,
      valid_until: ''
    });
    setEditingCoupon(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_uses: coupon.max_uses?.toString() || '',
      is_active: coupon.is_active,
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || form.discount_value <= 0) {
      toast.error('Please fill required fields');
      return;
    }
    saveMutation.mutate(editingCoupon ? { ...form, id: editingCoupon.id } : form);
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and promotions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="uppercase"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="20% off on all products"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') => setForm({ ...form, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value *</Label>
                  <Input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Order Amount</Label>
                  <Input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div>
                  <Label>Max Uses (empty = unlimited)</Label>
                  <Input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    min={0}
                  />
                </div>
              </div>
              <div>
                <Label>Valid Until (empty = no expiry)</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {editingCoupon ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            All Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : coupons && coupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? (
                          <>
                            <Percent className="h-4 w-4" />
                            {coupon.discount_value}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            {formatPrice(coupon.discount_value)}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(coupon.min_order_amount)}</TableCell>
                    <TableCell>
                      {coupon.used_count} / {coupon.max_uses || '∞'}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_until 
                        ? new Date(coupon.valid_until).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: coupon.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(coupon)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteMutation.mutate(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No coupons created yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
