import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface RelatedProductsProps {
  categoryId: string | null;
  currentProductId: string;
  limit?: number;
}

const RelatedProducts = ({ categoryId, currentProductId, limit = 4 }: RelatedProductsProps) => {
  const { data: products, isLoading } = useProducts({ limit: limit + 1 });
  const { addToCart } = useCart();

  // Filter out current product and limit results
  const relatedProducts = products
    ?.filter(p => p.id !== currentProductId)
    ?.filter(p => categoryId ? p.category_id === categoryId : true)
    ?.slice(0, limit) || [];

  // If not enough products in same category, fill with other products
  const fillerProducts = products
    ?.filter(p => p.id !== currentProductId && !relatedProducts.find(rp => rp.id === p.id))
    ?.slice(0, limit - relatedProducts.length) || [];

  const displayProducts = [...relatedProducts, ...fillerProducts].slice(0, limit);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '/placeholder.svg',
    });
    toast.success(`${product.name} added to cart!`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-fredoka font-bold text-foreground">🎁 Related Toys</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted aspect-square rounded-lg"></div>
              <div className="h-4 bg-muted mt-2 rounded"></div>
              <div className="h-4 bg-muted mt-1 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayProducts.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-fredoka font-bold text-foreground">🎁 Related Toys</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayProducts.map((product) => (
          <Card key={product.id} className="group overflow-hidden bg-card border-2 border-primary/20 hover:border-accent/50 transition-all rounded-2xl">
            <CardContent className="p-0">
              <Link to={`/product/${product.id}`} className="block">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.original_price && product.original_price > product.price && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                      {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </Link>
              <div className="p-3 space-y-2">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-fredoka font-bold text-foreground line-clamp-2 text-sm group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-primary font-bold">৳{product.price.toLocaleString()}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs text-muted-foreground line-through ml-1">
                        ৳{product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-primary hover:text-primary-foreground rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
