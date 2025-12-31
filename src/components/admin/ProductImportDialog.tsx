import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Search, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FetchedProduct {
  id?: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  sku?: string;
  stock?: number;
  category?: string;
}

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: FetchedProduct[];
  supplierName: string;
  categories: { id: string; name: string }[];
}

const ProductImportDialog = ({
  open,
  onOpenChange,
  products,
  supplierName,
  categories,
}: ProductImportDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleProduct = (index: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((_, i) => i)));
    }
  };

  const importMutation = useMutation({
    mutationFn: async (productsToImport: FetchedProduct[]) => {
      const insertData = productsToImport.map((p) => ({
        name: p.name,
        price: p.price || 0,
        description: p.description || null,
        image_url: p.image_url || null,
        sku: p.sku || null,
        stock: p.stock || 0,
        category_id: defaultCategoryId || null,
        is_active: true,
        is_featured: false,
      }));

      const { error } = await supabase.from('products').insert(insertData);
      if (error) throw error;
      return insertData.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Successfully imported ${count} products`);
      onOpenChange(false);
      setSelectedProducts(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import products');
    },
  });

  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product to import');
      return;
    }

    if (!defaultCategoryId) {
      toast.error('Please select a category for imported products');
      return;
    }

    setImporting(true);
    const productsToImport = Array.from(selectedProducts).map(
      (index) => filteredProducts[index]
    );
    await importMutation.mutateAsync(productsToImport);
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Import Products from {supplierName}
          </DialogTitle>
          <DialogDescription>
            Select the products you want to import to your store. {products.length} products available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Category Selection */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select category for import" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm text-muted-foreground">
                Select All ({filteredProducts.length} products)
              </span>
            </div>
            <Badge variant="secondary">
              {selectedProducts.size} selected
            </Badge>
          </div>

          {/* Products List */}
          <ScrollArea className="h-[400px] pr-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedProducts.has(index)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => toggleProduct(index)}
                  >
                    <Checkbox
                      checked={selectedProducts.has(index)}
                      onCheckedChange={() => toggleProduct(index)}
                    />
                    
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-secondary rounded-md flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                        )}
                        {product.stock !== undefined && (
                          <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        ৳{(product.price || 0).toLocaleString()}
                      </span>
                    </div>

                    {selectedProducts.has(index) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedProducts.size === 0 || importing || !defaultCategoryId}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Importing...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Import {selectedProducts.size} Products
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog;
