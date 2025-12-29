import React from 'react';
import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const RecentlyViewed: React.FC = () => {
  const { recentlyViewed, isLoading, clearHistory } = useRecentlyViewed();
  const { addToCart } = useCart();

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

  if (isLoading || recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Recently Viewed</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => clearHistory()}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentlyViewed.map(item => (
            <Card key={item.id} className="group overflow-hidden">
              <Link to={`/product/${item.product_id}`}>
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.product?.image_url || '/placeholder.svg'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </Link>
              <CardContent className="p-3">
                <Link 
                  to={`/product/${item.product_id}`}
                  className="font-medium text-sm line-clamp-2 hover:text-primary"
                >
                  {item.product?.name}
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary font-bold">
                    {formatPrice(item.product?.price || 0)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(item.product);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
