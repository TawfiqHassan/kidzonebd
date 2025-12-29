import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Palette, Package } from 'lucide-react';

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_adjustment: number | null;
  stock: number;
  attributes: Record<string, string> | null;
  image_url: string | null;
  is_active: boolean;
}

interface ProductVariantsDialogProps {
  productId: string;
  productName: string;
  basePrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductVariantsDialog: React.FC<ProductVariantsDialogProps> = ({
  productId,
  productName,
  basePrice,
  open,
  onOpenChange
}) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price_adjustment: '0',
    stock: '0',
    color: '',
    size: '',
    image_url: '',
    is_active: true
  });

  const { data: variants, isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const attributes: Record<string, string> = {};
      if (data.color) attributes.color = data.color;
      if (data.size) attributes.size = data.size;

      const { error } = await supabase.from('product_variants').insert({
        product_id: productId,
        name: data.name,
        sku: data.sku || null,
        price_adjustment: parseFloat(data.price_adjustment) || 0,
        stock: parseInt(data.stock) || 0,
        attributes: Object.keys(attributes).length > 0 ? attributes : null,
        image_url: data.image_url || null,
        is_active: data.is_active
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant created successfully');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const attributes: Record<string, string> = {};
      if (data.color) attributes.color = data.color;
      if (data.size) attributes.size = data.size;

      const { error } = await supabase.from('product_variants').update({
        name: data.name,
        sku: data.sku || null,
        price_adjustment: parseFloat(data.price_adjustment) || 0,
        stock: parseInt(data.stock) || 0,
        attributes: Object.keys(attributes).length > 0 ? attributes : null,
        image_url: data.image_url || null,
        is_active: data.is_active
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant updated successfully');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      price_adjustment: '0',
      stock: '0',
      color: '',
      size: '',
      image_url: '',
      is_active: true
    });
    setIsEditing(false);
    setEditingVariant(null);
  };

  const openEditMode = (variant: ProductVariant) => {
    const attrs = variant.attributes || {};
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      sku: variant.sku || '',
      price_adjustment: String(variant.price_adjustment || 0),
      stock: String(variant.stock),
      color: attrs.color || '',
      size: attrs.size || '',
      image_url: variant.image_url || '',
      is_active: variant.is_active
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Variant name is required');
      return;
    }

    if (editingVariant) {
      updateMutation.mutate({ id: editingVariant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;

  const calculateFinalPrice = (adjustment: number | null) => {
    return basePrice + (adjustment || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Manage Variants - {productName}
          </DialogTitle>
          <DialogDescription>
            Add size, color, or other variants for this product. Base price: {formatPrice(basePrice)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Edit Variant Form */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEditing ? 'Edit Variant' : 'Add New Variant'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="variant-name">Variant Name *</Label>
                  <Input
                    id="variant-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Red - Large"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="variant-color">Color</Label>
                  <Input
                    id="variant-color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Red, Blue, Black"
                  />
                </div>
                
                <div>
                  <Label htmlFor="variant-size">Size</Label>
                  <Input
                    id="variant-size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., S, M, L, XL"
                  />
                </div>
                
                <div>
                  <Label htmlFor="variant-sku">SKU</Label>
                  <Input
                    id="variant-sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., PROD-RED-L"
                  />
                </div>
                
                <div>
                  <Label htmlFor="variant-price">Price Adjustment (৳)</Label>
                  <Input
                    id="variant-price"
                    type="number"
                    step="0.01"
                    value={formData.price_adjustment}
                    onChange={(e) => setFormData({ ...formData, price_adjustment: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Final: {formatPrice(calculateFinalPrice(parseFloat(formData.price_adjustment) || 0))}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="variant-stock">Stock</Label>
                  <Input
                    id="variant-stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-3">
                  <Label htmlFor="variant-image">Image URL</Label>
                  <Input
                    id="variant-image"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/variant-image.jpg"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="variant-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="variant-active">Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditing ? 'Update Variant' : 'Add Variant'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Variants List */}
          <div>
            <h3 className="font-semibold mb-4">Existing Variants ({variants?.length || 0})</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : variants && variants.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {variant.image_url ? (
                              <img
                                src={variant.image_url}
                                alt={variant.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{variant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {variant.attributes?.color && (
                              <Badge variant="outline" className="text-xs">
                                Color: {variant.attributes.color}
                              </Badge>
                            )}
                            {variant.attributes?.size && (
                              <Badge variant="outline" className="text-xs">
                                Size: {variant.attributes.size}
                              </Badge>
                            )}
                            {!variant.attributes?.color && !variant.attributes?.size && (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {variant.sku || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-primary">
                              {formatPrice(calculateFinalPrice(variant.price_adjustment))}
                            </span>
                            {variant.price_adjustment !== 0 && (
                              <span className="text-xs text-muted-foreground block">
                                ({variant.price_adjustment! > 0 ? '+' : ''}{formatPrice(variant.price_adjustment!)})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={variant.stock < 10 ? 'text-destructive font-medium' : ''}>
                            {variant.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                            {variant.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditMode(variant)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this variant?')) {
                                  deleteMutation.mutate(variant.id);
                                }
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No variants yet. Add your first variant above.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductVariantsDialog;
