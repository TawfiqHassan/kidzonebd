import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  shipping_rate: number;
  free_shipping_threshold: number | null;
  estimated_days: string | null;
  is_active: boolean;
}

const AdminShippingZones: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    regions: '',
    shipping_rate: '',
    free_shipping_threshold: '',
    estimated_days: '',
    is_active: true
  });

  const { data: zones, isLoading } = useQuery({
    queryKey: ['admin-shipping-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('shipping_rate', { ascending: true });
      if (error) throw error;
      return data as ShippingZone[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const zoneData = {
        name: data.name,
        regions: data.regions.split(',').map(r => r.trim()).filter(Boolean),
        shipping_rate: parseFloat(data.shipping_rate) || 0,
        free_shipping_threshold: data.free_shipping_threshold ? parseFloat(data.free_shipping_threshold) : null,
        estimated_days: data.estimated_days || null,
        is_active: data.is_active
      };

      if (data.id) {
        const { error } = await supabase
          .from('shipping_zones')
          .update(zoneData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_zones')
          .insert(zoneData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-zones'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      toast.success(editingZone ? 'Zone updated' : 'Zone created');
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-zones'] });
      toast.success('Zone deleted');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const resetForm = () => {
    setFormData({
      name: '',
      regions: '',
      shipping_rate: '',
      free_shipping_threshold: '',
      estimated_days: '',
      is_active: true
    });
    setEditingZone(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      regions: zone.regions.join(', '),
      shipping_rate: zone.shipping_rate.toString(),
      free_shipping_threshold: zone.free_shipping_threshold?.toString() || '',
      estimated_days: zone.estimated_days || '',
      is_active: zone.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingZone ? { ...formData, id: editingZone.id } : formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Shipping Zones
          </h1>
          <p className="text-muted-foreground mt-1">Configure shipping rates for different regions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingZone ? 'Edit Zone' : 'Add Zone'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Zone Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Inside Dhaka"
                  required
                />
              </div>
              <div>
                <Label>Regions (comma-separated) *</Label>
                <Input
                  value={formData.regions}
                  onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                  placeholder="e.g., Dhaka, Gazipur, Narayanganj"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shipping Rate (৳) *</Label>
                  <Input
                    type="number"
                    value={formData.shipping_rate}
                    onChange={(e) => setFormData({ ...formData, shipping_rate: e.target.value })}
                    placeholder="60"
                    required
                  />
                </div>
                <div>
                  <Label>Free Shipping Above (৳)</Label>
                  <Input
                    type="number"
                    value={formData.free_shipping_threshold}
                    onChange={(e) => setFormData({ ...formData, free_shipping_threshold: e.target.value })}
                    placeholder="2000"
                  />
                </div>
              </div>
              <div>
                <Label>Estimated Delivery</Label>
                <Input
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                  placeholder="e.g., 1-2 days"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {editingZone ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Zones</CardTitle>
          <CardDescription>Manage shipping rates for different delivery areas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : zones && zones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Regions</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Free Above</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {zone.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {zone.regions.slice(0, 3).map((region) => (
                          <Badge key={region} variant="secondary" className="text-xs">
                            {region}
                          </Badge>
                        ))}
                        {zone.regions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{zone.regions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      ৳{zone.shipping_rate}
                    </TableCell>
                    <TableCell>
                      {zone.free_shipping_threshold 
                        ? `৳${zone.free_shipping_threshold.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>{zone.estimated_days || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(zone)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete this zone?')) {
                              deleteMutation.mutate(zone.id);
                            }
                          }}
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
              No shipping zones configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShippingZones;
