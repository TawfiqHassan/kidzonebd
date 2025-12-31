import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, ExternalLink, RefreshCw, Building2, Download, Zap, Eye, EyeOff, HelpCircle, CheckCircle2, ArrowRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import ProductImportDialog from '@/components/admin/ProductImportDialog';

interface Supplier {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  api_endpoint: string | null;
  api_key: string | null;
  api_headers: Record<string, string> | null;
  auth_type: string;
  product_mapping: Record<string, string> | null;
  status: string;
  notes: string | null;
  last_sync_at: string | null;
  created_at: string;
}

const Suppliers = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [fetchingProducts, setFetchingProducts] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [currentSupplierName, setCurrentSupplierName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
    api_endpoint: '',
    api_key: '',
    auth_type: 'bearer',
    api_headers: '',
    status: 'active',
    notes: '',
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let apiHeaders = {};
      if (data.api_headers) {
        try {
          apiHeaders = JSON.parse(data.api_headers);
        } catch (e) {
          throw new Error('Invalid JSON in custom headers');
        }
      }

      const { error } = await supabase.from('suppliers').insert({
        name: data.name,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        website: data.website || null,
        address: data.address || null,
        api_endpoint: data.api_endpoint || null,
        api_key: data.api_key || null,
        auth_type: data.auth_type,
        api_headers: apiHeaders,
        status: data.status,
        notes: data.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier added successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add supplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      let apiHeaders = {};
      if (data.api_headers) {
        try {
          apiHeaders = JSON.parse(data.api_headers);
        } catch (e) {
          throw new Error('Invalid JSON in custom headers');
        }
      }

      const { error } = await supabase
        .from('suppliers')
        .update({
          name: data.name,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          website: data.website || null,
          address: data.address || null,
          api_endpoint: data.api_endpoint || null,
          api_key: data.api_key || null,
          auth_type: data.auth_type,
          api_headers: apiHeaders,
          status: data.status,
          notes: data.notes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update supplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete supplier');
    },
  });

  const testApiConnection = async (supplier: Supplier) => {
    if (!supplier.api_endpoint) {
      toast.error('No API endpoint configured for this supplier');
      return;
    }

    setTestingApi(supplier.id);

    try {
      const { data, error } = await supabase.functions.invoke('supplier-api', {
        body: {
          action: 'test',
          endpoint: supplier.api_endpoint,
          apiKey: supplier.api_key,
          authType: supplier.auth_type,
          headers: supplier.api_headers,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Connected to ${supplier.name} API successfully!`);
        console.log('API Response Preview:', data.preview);
      } else {
        toast.error(data.error || 'Connection failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test connection');
    } finally {
      setTestingApi(null);
    }
  };

  const fetchProductsFromApi = async (supplier: Supplier) => {
    if (!supplier.api_endpoint) {
      toast.error('No API endpoint configured');
      return;
    }

    setFetchingProducts(supplier.id);

    try {
      const { data, error } = await supabase.functions.invoke('supplier-api', {
        body: {
          action: 'fetch_products',
          supplierId: supplier.id,
        },
      });

      if (error) throw error;

      if (data.success && data.products) {
        setFetchedProducts(data.products);
        setCurrentSupplierName(supplier.name);
        setImportDialogOpen(true);
        toast.success(`Fetched ${data.total} products from ${data.supplier}`);
      } else {
        toast.error(data.error || 'Failed to fetch products');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch products');
    } finally {
      setFetchingProducts(null);
    }
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Supplier name is required');
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      address: '',
      api_endpoint: '',
      api_key: '',
      auth_type: 'bearer',
      api_headers: '',
      status: 'active',
      notes: '',
    });
    setEditingSupplier(null);
    setShowApiKey(false);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_email: supplier.contact_email || '',
      contact_phone: supplier.contact_phone || '',
      website: supplier.website || '',
      address: supplier.address || '',
      api_endpoint: supplier.api_endpoint || '',
      api_key: supplier.api_key || '',
      auth_type: supplier.auth_type || 'bearer',
      api_headers: supplier.api_headers ? JSON.stringify(supplier.api_headers, null, 2) : '',
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tutorial Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="w-5 h-5 text-primary" />
            How to Add External Supplier APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tutorial" className="border-none">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                View step-by-step guide
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Step 1: Get API credentials from your supplier</p>
                      <p className="text-muted-foreground">Contact the supplier and request API access. They'll provide an API endpoint URL and API key.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Step 2: Add the supplier</p>
                      <p className="text-muted-foreground">Click "Add Supplier", enter their details, API endpoint (e.g., https://api.supplier.com/products), and API key.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Step 3: Test the connection</p>
                      <p className="text-muted-foreground">Click "Test" to verify the API works. You'll see a success message if connected.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Step 4: Fetch and import products</p>
                      <p className="text-muted-foreground">Click "Fetch" to retrieve products, then select which ones to import to your store.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">Manage supplier information and connect external APIs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 234-567-8900"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://supplier.com"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              
              <div className="col-span-2 border-t border-border pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">External API Integration</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect to your supplier's API to automatically fetch products, prices, and inventory.
                </p>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="api_endpoint">API Endpoint URL</Label>
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  placeholder="https://api.supplier.com/v1/products"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The URL to fetch products from (usually ends with /products or /items)
                </p>
              </div>
              
              <div>
                <Label htmlFor="auth_type">Authentication Type</Label>
                <Select value={formData.auth_type} onValueChange={(value) => setFormData({ ...formData, auth_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="api_key">API Key (X-API-Key header)</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="custom">Custom Headers</SelectItem>
                    <SelectItem value="none">No Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="api_key">API Key / Token</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Your API key or token"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {formData.auth_type === 'custom' && (
                <div className="col-span-2">
                  <Label htmlFor="api_headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="api_headers"
                    value={formData.api_headers}
                    onChange={(e) => setFormData({ ...formData, api_headers: e.target.value })}
                    placeholder='{"Authorization": "Custom abc123", "X-Custom-Header": "value"}'
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter custom headers as JSON object
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this supplier..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingSupplier ? 'Update' : 'Add')} Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold text-foreground">{suppliers.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-3xl font-bold text-foreground">
                {suppliers.filter(s => s.status === 'active').length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With API Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-foreground">
                {suppliers.filter(s => s.api_endpoint).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>API Integration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No suppliers found. Add your first supplier to get started.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        {supplier.address && (
                          <p className="text-sm text-muted-foreground">{supplier.address}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.contact_email && (
                          <p className="text-sm text-foreground">{supplier.contact_email}</p>
                        )}
                        {supplier.contact_phone && (
                          <p className="text-sm text-muted-foreground">{supplier.contact_phone}</p>
                        )}
                        {supplier.website && (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.api_endpoint ? (
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <Zap className="w-3 h-3 mr-1" />
                            API Connected
                          </Badge>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {supplier.api_endpoint}
                          </p>
                          {supplier.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Last sync: {new Date(supplier.last_sync_at).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testApiConnection(supplier)}
                              disabled={testingApi === supplier.id}
                              className="h-7 text-xs gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${testingApi === supplier.id ? 'animate-spin' : ''}`} />
                              Test
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchProductsFromApi(supplier)}
                              disabled={fetchingProducts === supplier.id}
                              className="h-7 text-xs gap-1"
                            >
                              <Download className={`w-3 h-3 ${fetchingProducts === supplier.id ? 'animate-bounce' : ''}`} />
                              Fetch
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not configured</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(supplier)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this supplier?')) {
                              deleteMutation.mutate(supplier.id);
                            }
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Product Import Dialog */}
      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        products={fetchedProducts}
        supplierName={currentSupplierName}
        categories={categories}
      />
    </div>
  );
};

export default Suppliers;
