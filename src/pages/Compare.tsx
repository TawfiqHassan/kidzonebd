import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CartProvider, useCart } from '@/context/CartContext';
import { useProductComparison } from '@/hooks/useProductComparison';
import { X, ShoppingCart, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';

const CompareContent: React.FC = () => {
  const { comparisonProducts, removeFromComparison, clearComparison, isLoading } = useProductComparison();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '/placeholder.svg'
    });
    toast.success('Added to cart');
  };

  // Get all unique specification keys
  const allSpecKeys = React.useMemo(() => {
    const keys = new Set<string>();
    comparisonProducts.forEach(cp => {
      if (cp.product?.specifications) {
        Object.keys(cp.product.specifications).forEach(key => keys.add(key));
      }
    });
    return Array.from(keys);
  }, [comparisonProducts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Compare Products</h1>
            <p className="text-muted-foreground">Compare features and specifications side by side</p>
          </div>
          {comparisonProducts.length > 0 && (
            <Button variant="outline" onClick={() => clearComparison()}>
              Clear All
            </Button>
          )}
        </div>

        {comparisonProducts.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <p className="text-muted-foreground mb-4">No products to compare</p>
              <p className="text-sm text-muted-foreground mb-6">
                Add products to comparison from product pages or listings
              </p>
              <Link to="/">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-muted/50 min-w-[200px]">Feature</th>
                  {comparisonProducts.map(cp => (
                    <th key={cp.id} className="p-4 bg-muted/50 min-w-[250px]">
                      <div className="relative">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute -top-2 -right-2"
                          onClick={() => removeFromComparison(cp.product_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <img
                          src={cp.product?.image_url || '/placeholder.svg'}
                          alt={cp.product?.name}
                          className="w-32 h-32 object-cover mx-auto mb-3 rounded-lg"
                        />
                        <Link 
                          to={`/product/${cp.product_id}`}
                          className="font-semibold hover:text-primary line-clamp-2"
                        >
                          {cp.product?.name}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Price</td>
                  {comparisonProducts.map(cp => (
                    <td key={cp.id} className="p-4 text-center">
                      <div className="text-xl font-bold text-primary">
                        {formatPrice(cp.product?.price || 0)}
                      </div>
                      {cp.product?.original_price && cp.product.original_price > cp.product.price && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(cp.product.original_price)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Brand Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Brand</td>
                  {comparisonProducts.map(cp => (
                    <td key={cp.id} className="p-4 text-center">
                      {cp.product?.brand || '-'}
                    </td>
                  ))}
                </tr>

                {/* Stock Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Availability</td>
                  {comparisonProducts.map(cp => (
                    <td key={cp.id} className="p-4 text-center">
                      {(cp.product?.stock || 0) > 0 ? (
                        <Badge className="bg-green-500/20 text-green-500">In Stock</Badge>
                      ) : (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Description Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium align-top">Description</td>
                  {comparisonProducts.map(cp => (
                    <td key={cp.id} className="p-4 text-sm text-muted-foreground">
                      {cp.product?.description || '-'}
                    </td>
                  ))}
                </tr>

                {/* Specifications */}
                {allSpecKeys.map(key => (
                  <tr key={key} className="border-b border-border">
                    <td className="p-4 font-medium capitalize">{key.replace(/_/g, ' ')}</td>
                    {comparisonProducts.map(cp => {
                      const value = cp.product?.specifications?.[key];
                      return (
                        <td key={cp.id} className="p-4 text-center">
                          {value !== undefined ? (
                            typeof value === 'boolean' ? (
                              value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
                            ) : (
                              String(value)
                            )
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Add to Cart Row */}
                <tr>
                  <td className="p-4 font-medium">Action</td>
                  {comparisonProducts.map(cp => (
                    <td key={cp.id} className="p-4 text-center">
                      <Button
                        onClick={() => handleAddToCart(cp.product)}
                        disabled={(cp.product?.stock || 0) === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const Compare: React.FC = () => (
  <CartProvider>
    <CompareContent />
  </CartProvider>
);

export default Compare;
