import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Link2, Loader2, Check, AlertCircle, Download, Edit, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  brand: string | null;
  specifications: Record<string, string> | null;
}

interface ProductUrlScraperProps {
  categories: Array<{ id: string; name: string }>;
}

export const ProductUrlScraper = ({ categories }: ProductUrlScraperProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(null);
  const [editedProduct, setEditedProduct] = useState<ScrapedProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const scrapeMutation = useMutation({
    mutationFn: async (productUrl: string) => {
      const { data, error } = await supabase.functions.invoke('scrape-product-url', {
        body: { url: productUrl },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to scrape URL');
      return data.product as ScrapedProduct;
    },
    onSuccess: (data) => {
      setScrapedProduct(data);
      setEditedProduct(data);
      toast.success('Product info extracted successfully!');
    },
    onError: (error) => {
      console.error('Scrape error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scrape URL');
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!editedProduct) throw new Error('No product data');

      const { error } = await supabase.from('products').insert({
        name: editedProduct.name,
        description: editedProduct.description,
        price: editedProduct.price,
        original_price: editedProduct.original_price,
        image_url: editedProduct.image_url,
        brand: editedProduct.brand,
        specifications: editedProduct.specifications,
        category_id: selectedCategory || null,
        is_active: true,
        is_featured: false,
        stock: 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product imported successfully!');
      resetForm();
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('Failed to import product');
    },
  });

  const handleScrape = () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    scrapeMutation.mutate(url);
  };

  const resetForm = () => {
    setUrl('');
    setScrapedProduct(null);
    setEditedProduct(null);
    setSelectedCategory('');
    setIsEditing(false);
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link2 className="w-4 h-4" />
          Import from URL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Import Product from URL
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="https://example.com/product-page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={scrapeMutation.isPending}
              />
            </div>
            <Button 
              onClick={handleScrape} 
              disabled={scrapeMutation.isPending || !url.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {scrapeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Extract
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Paste any product URL and we'll automatically extract the product information using AI.
          </p>

          {/* Scraped Product Preview */}
          {scrapedProduct && editedProduct && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Product Extracted
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                </div>
                <CardDescription>
                  Review and edit the extracted information before importing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Product Name</Label>
                      <Input
                        id="edit-name"
                        value={editedProduct.name || ''}
                        onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editedProduct.description || ''}
                        onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-price">Price</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          value={editedProduct.price || 0}
                          onChange={(e) => setEditedProduct({ ...editedProduct, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-original-price">Original Price (optional)</Label>
                        <Input
                          id="edit-original-price"
                          type="number"
                          value={editedProduct.original_price || ''}
                          onChange={(e) => setEditedProduct({ ...editedProduct, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-brand">Brand</Label>
                      <Input
                        id="edit-brand"
                        value={editedProduct.brand || ''}
                        onChange={(e) => setEditedProduct({ ...editedProduct, brand: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-image">Image URL</Label>
                      <Input
                        id="edit-image"
                        value={editedProduct.image_url || ''}
                        onChange={(e) => setEditedProduct({ ...editedProduct, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  /* Preview Mode */
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-32 h-32 rounded-lg border border-border overflow-hidden bg-muted flex-shrink-0">
                      {editedProduct.image_url ? (
                        <img
                          src={editedProduct.image_url}
                          alt={editedProduct.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {editedProduct.name || 'No name extracted'}
                      </h3>
                      
                      {editedProduct.brand && (
                        <Badge variant="secondary">{editedProduct.brand}</Badge>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          ${editedProduct.price?.toFixed(2) || '0.00'}
                        </span>
                        {editedProduct.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${editedProduct.original_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {editedProduct.description || 'No description extracted'}
                      </p>

                      {editedProduct.specifications && Object.keys(editedProduct.specifications).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(editedProduct.specifications).slice(0, 4).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Category Selection */}
                <div className="pt-4 border-t border-border">
                  <Label htmlFor="category">Assign to Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category (optional)" />
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

                {/* Import Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending || !editedProduct.name}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Import Product
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {scrapeMutation.isError && !scrapedProduct && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Failed to extract product</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The URL might be blocked or the page structure isn't recognized. 
                      Try a different product page or enter the product details manually.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
