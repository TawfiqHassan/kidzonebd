import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Package, Upload, Download, FileSpreadsheet, ChevronDown, Copy, MoreHorizontal, Palette } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProductUrlScraper } from '@/components/admin/ProductUrlScraper';
import ProductVariantsDialog from '@/components/admin/ProductVariantsDialog';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  image_url: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  sku: string | null;
  brand: string | null;
  category?: { name: string } | null;
}

interface BulkImportRow {
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category_name?: string;
  image_url?: string;
  stock: number;
  is_featured?: boolean;
  is_active?: boolean;
  sku?: string;
  brand?: string;
}

const AdminProducts: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [bulkImportData, setBulkImportData] = useState<BulkImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkEditField, setBulkEditField] = useState<'stock' | 'price' | 'status' | 'category' | ''>('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [variantsDialogProduct, setVariantsDialogProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category_id: '',
    image_url: '',
    stock: '0',
    is_featured: false,
    is_active: true,
    sku: '',
    brand: ''
  });

  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('products').insert({
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        category_id: data.category_id || null,
        image_url: data.image_url || null,
        stock: parseInt(data.stock),
        is_featured: data.is_featured,
        is_active: data.is_active,
        sku: data.sku || null,
        brand: data.brand || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('products').update({
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        category_id: data.category_id || null,
        image_url: data.image_url || null,
        stock: parseInt(data.stock),
        is_featured: data.is_featured,
        is_active: data.is_active,
        sku: data.sku || null,
        brand: data.brand || null
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProducts([]);
      toast.success('Products deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Product> }) => {
      const { error } = await supabase.from('products').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProducts([]);
      setIsBulkEditDialogOpen(false);
      setBulkEditField('');
      setBulkEditValue('');
      toast.success('Products updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Duplicate product mutation
  const duplicateMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase.from('products').insert({
        name: `${product.name} (Copy)`,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        category_id: product.category_id,
        image_url: product.image_url,
        stock: product.stock,
        is_featured: false,
        is_active: false,
        sku: product.sku ? `${product.sku}-COPY` : null,
        brand: product.brand
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product duplicated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (products && selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else if (products) {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      bulkDeleteMutation.mutate(selectedProducts);
    }
  };

  const handleBulkStatusChange = (isActive: boolean) => {
    if (selectedProducts.length === 0) return;
    bulkUpdateMutation.mutate({ ids: selectedProducts, updates: { is_active: isActive } });
  };

  const handleBulkEdit = () => {
    if (!bulkEditField || !bulkEditValue) {
      toast.error('Please select a field and enter a value');
      return;
    }

    let updates: Partial<Product> = {};
    switch (bulkEditField) {
      case 'stock':
        updates = { stock: parseInt(bulkEditValue) };
        break;
      case 'price':
        updates = { price: parseFloat(bulkEditValue) };
        break;
      case 'category':
        updates = { category_id: bulkEditValue };
        break;
    }

    bulkUpdateMutation.mutate({ ids: selectedProducts, updates });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      category_id: '',
      image_url: '',
      stock: '0',
      is_featured: false,
      is_active: true,
      sku: '',
      brand: ''
    });
    setEditingProduct(null);
  };

  // CSV Template Download
  const downloadCSVTemplate = () => {
    const headers = ['name', 'description', 'price', 'original_price', 'category_name', 'image_url', 'stock', 'sku', 'brand', 'is_featured', 'is_active'];
    const sampleRow = ['Sample Product', 'Product description here', '1000', '1200', 'Mobile Accessories', 'https://example.com/image.jpg', '50', 'SKU-001', 'Brand Name', 'false', 'true'];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  // Parse CSV file
  const parseCSV = (text: string): BulkImportRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products: BulkImportRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const product: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'name':
            product.name = value;
            break;
          case 'description':
            product.description = value || undefined;
            break;
          case 'price':
            product.price = parseFloat(value) || 0;
            break;
          case 'original_price':
            product.original_price = value ? parseFloat(value) : undefined;
            break;
          case 'category_name':
            product.category_name = value || undefined;
            break;
          case 'image_url':
            product.image_url = value || undefined;
            break;
          case 'stock':
            product.stock = parseInt(value) || 0;
            break;
          case 'sku':
            product.sku = value || undefined;
            break;
          case 'brand':
            product.brand = value || undefined;
            break;
          case 'is_featured':
            product.is_featured = value.toLowerCase() === 'true';
            break;
          case 'is_active':
            product.is_active = value.toLowerCase() !== 'false';
            break;
        }
      });
      
      if (product.name && product.price > 0) {
        products.push(product);
      }
    }
    
    return products;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        toast.error('No valid products found in CSV');
        return;
      }
      
      setBulkImportData(parsed);
      toast.success(`Found ${parsed.length} products ready to import`);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bulk import products
  const handleBulkImport = async () => {
    if (bulkImportData.length === 0) {
      toast.error('No products to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < bulkImportData.length; i++) {
      const product = bulkImportData[i];
      
      // Find category ID by name
      let categoryId: string | null = null;
      if (product.category_name && categories) {
        const category = categories.find(
          c => c.name.toLowerCase() === product.category_name?.toLowerCase()
        );
        categoryId = category?.id || null;
      }

      try {
        const { error } = await supabase.from('products').insert({
          name: product.name,
          description: product.description || null,
          price: product.price,
          original_price: product.original_price || null,
          category_id: categoryId,
          image_url: product.image_url || null,
          stock: product.stock,
          sku: product.sku || null,
          brand: product.brand || null,
          is_featured: product.is_featured || false,
          is_active: product.is_active !== false
        });

        if (error) {
          errorCount++;
          console.error(`Failed to import "${product.name}":`, error.message);
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }

      setImportProgress(Math.round(((i + 1) / bulkImportData.length) * 100));
    }

    setIsImporting(false);
    setBulkImportData([]);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });

    if (errorCount === 0) {
      toast.success(`Successfully imported ${successCount} products`);
    } else {
      toast.warning(`Imported ${successCount} products, ${errorCount} failed`);
    }

    setIsBulkDialogOpen(false);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      stock: String(product.stock),
      is_featured: product.is_featured,
      is_active: product.is_active,
      sku: product.sku || '',
      brand: product.brand || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        
        <div className="flex gap-2">
          {/* Bulk Import Dialog */}
          <Dialog open={isBulkDialogOpen} onOpenChange={(open) => {
            setIsBulkDialogOpen(open);
            if (!open) {
              setBulkImportData([]);
              setImportProgress(0);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Bulk Product Import
                </DialogTitle>
                <DialogDescription>
                  Import multiple products at once using a CSV file
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Download Template */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Step 1: Download Template</CardTitle>
                    <CardDescription>
                      Download the CSV template and fill in your product data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={downloadCSVTemplate} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV Template
                    </Button>
                  </CardContent>
                </Card>

                {/* Upload CSV */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Step 2: Upload Your CSV</CardTitle>
                    <CardDescription>
                      Upload the filled CSV file to import products
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      disabled={isImporting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose CSV File
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview & Import */}
                {bulkImportData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Step 3: Review & Import</CardTitle>
                      <CardDescription>
                        {bulkImportData.length} products ready to import
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Preview Table */}
                      <div className="max-h-48 overflow-auto border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Category</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulkImportData.slice(0, 5).map((product, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>৳{product.price}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>{product.category_name || '-'}</TableCell>
                              </TableRow>
                            ))}
                            {bulkImportData.length > 5 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  ...and {bulkImportData.length - 5} more products
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Progress */}
                      {isImporting && (
                        <div className="space-y-2">
                          <Progress value={importProgress} className="h-2" />
                          <p className="text-sm text-center text-muted-foreground">
                            Importing... {importProgress}%
                          </p>
                        </div>
                      )}

                      {/* Import Button */}
                      <Button 
                        onClick={handleBulkImport}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={isImporting}
                      >
                        {isImporting ? 'Importing...' : `Import ${bulkImportData.length} Products`}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Product Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>

          {/* Import from URL */}
          <ProductUrlScraper categories={categories || []} />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product details' : 'Add a new product to your store'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price (৳) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="original_price">Original Price (৳)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Featured Product</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk Actions Bar */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">{selectedProducts.length} selected</span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkStatusChange(true)}>
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange(false)}>
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setBulkEditField('stock'); setIsBulkEditDialogOpen(true); }}>
                  Update Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkEditField('price'); setIsBulkEditDialogOpen(true); }}>
                  Update Price
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkEditField('category'); setIsBulkEditDialogOpen(true); }}>
                  Change Category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update {selectedProducts.length} Products</DialogTitle>
            <DialogDescription>
              {bulkEditField === 'stock' && 'Set new stock value for selected products'}
              {bulkEditField === 'price' && 'Set new price for selected products'}
              {bulkEditField === 'category' && 'Change category for selected products'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bulkEditField === 'stock' && (
              <div>
                <Label>New Stock Value</Label>
                <Input
                  type="number"
                  value={bulkEditValue}
                  onChange={(e) => setBulkEditValue(e.target.value)}
                  placeholder="Enter stock quantity"
                />
              </div>
            )}
            {bulkEditField === 'price' && (
              <div>
                <Label>New Price (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={bulkEditValue}
                  onChange={(e) => setBulkEditValue(e.target.value)}
                  placeholder="Enter new price"
                />
              </div>
            )}
            {bulkEditField === 'category' && (
              <div>
                <Label>Select Category</Label>
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkEdit}
                disabled={bulkUpdateMutation.isPending}
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark"
              >
                Update Products
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={products && products.length > 0 && selectedProducts.length === products.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id} className={selectedProducts.includes(product.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.name || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-brand-gold">{formatPrice(Number(product.price))}</p>
                      {product.original_price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(Number(product.original_price))}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={product.stock < 10 ? 'text-destructive font-medium' : ''}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                        product.is_active 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.is_featured && (
                        <span className="text-xs px-2 py-1 rounded-full bg-brand-gold/20 text-brand-gold w-fit">
                          Featured
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVariantsDialogProduct(product)}>
                          <Palette className="h-4 w-4 mr-2" />
                          Manage Variants
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(product)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Variants Dialog */}
      {variantsDialogProduct && (
        <ProductVariantsDialog
          productId={variantsDialogProduct.id}
          productName={variantsDialogProduct.name}
          basePrice={variantsDialogProduct.price}
          open={!!variantsDialogProduct}
          onOpenChange={(open) => !open && setVariantsDialogProduct(null)}
        />
      )}
    </div>
  );
};

export default AdminProducts;
