import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider, useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Clock, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface FlashSaleProduct {
  id: string;
  sale_price: number;
  max_quantity: number | null;
  sold_quantity: number | null;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
    description: string | null;
  };
}

interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_time: string;
  end_time: string;
}

const FlashSaleContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [timeLeft, setTimeLeft] = React.useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const { data: flashSale, isLoading: saleLoading } = useQuery({
    queryKey: ['flash-sale', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as FlashSale | null;
    },
    enabled: !!id
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['flash-sale-products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sale_products')
        .select(`
          id,
          sale_price,
          max_quantity,
          sold_quantity,
          product:products (id, name, price, image_url, stock, description)
        `)
        .eq('flash_sale_id', id);
      
      if (error) throw error;
      return data as unknown as FlashSaleProduct[];
    },
    enabled: !!id
  });

  React.useEffect(() => {
    if (!flashSale) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(flashSale.end_time).getTime();
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  const handleAddToCart = (product: FlashSaleProduct) => {
    if (!product.product) return;
    
    addToCart({
      id: product.product.id,
      name: product.product.name,
      price: product.sale_price,
      image: product.product.image_url || '',
      quantity: 1
    });
    toast.success(`${product.product.name} added to cart at flash sale price!`);
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;

  const calculateDiscount = (originalPrice: number, salePrice: number) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const isLoading = saleLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!flashSale) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-4">Flash Sale Not Found</h1>
          <p className="text-muted-foreground mb-6">This flash sale may have ended or doesn't exist.</p>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Flash Sale Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <Zap className="h-8 w-8 animate-pulse" />
                <h1 className="text-3xl md:text-4xl font-bold">{flashSale.name}</h1>
              </div>
              {flashSale.description && (
                <p className="text-lg opacity-90">{flashSale.description}</p>
              )}
              <Badge className="mt-3 bg-white/20 text-white border-0 text-lg px-4 py-1">
                Up to {flashSale.discount_percentage}% OFF
              </Badge>
            </div>
            
            {timeLeft ? (
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Ends in:</span>
                </div>
                <div className="flex gap-2 text-2xl font-bold">
                  <div className="bg-white/20 px-4 py-2 rounded-lg">
                    <span className="font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-xs block">Hours</span>
                  </div>
                  <span className="self-center">:</span>
                  <div className="bg-white/20 px-4 py-2 rounded-lg">
                    <span className="font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-xs block">Mins</span>
                  </div>
                  <span className="self-center">:</span>
                  <div className="bg-white/20 px-4 py-2 rounded-lg">
                    <span className="font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-xs block">Secs</span>
                  </div>
                </div>
              </div>
            ) : (
              <Badge variant="destructive" className="text-lg">Sale Ended</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-xl font-semibold">Flash Sale Products</h2>
          <Badge variant="outline">{products?.length || 0} items</Badge>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((item) => {
              if (!item.product) return null;
              const discount = calculateDiscount(item.product.price, item.sale_price);
              const isOutOfStock = item.product.stock <= 0 || 
                (item.max_quantity && item.sold_quantity && item.sold_quantity >= item.max_quantity);
              
              return (
                <Card 
                  key={item.id} 
                  className={`group overflow-hidden hover:shadow-lg transition-shadow ${isOutOfStock ? 'opacity-75' : ''}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Zap className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                      -{discount}%
                    </Badge>
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Sold Out</Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors mb-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(item.sale_price)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(item.product.price)}
                      </span>
                    </div>
                    
                    {item.max_quantity && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Sold: {item.sold_quantity || 0}</span>
                          <span>Available: {item.max_quantity - (item.sold_quantity || 0)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                            style={{ width: `${((item.sold_quantity || 0) / item.max_quantity) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => handleAddToCart(item)}
                      disabled={isOutOfStock || !timeLeft}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No products in this flash sale yet.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const FlashSale: React.FC = () => {
  return (
    <CartProvider>
      <FlashSaleContent />
    </CartProvider>
  );
};

export default FlashSale;
