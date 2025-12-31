import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Minus, Plus, Package, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/CartContext';
import { useProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import ProductReviews from '@/components/ProductReviews';
import SocialShare from '@/components/SocialShare';
import RelatedProducts from '@/components/RelatedProducts';
import Breadcrumbs from '@/components/Breadcrumbs';
import ImageGallery from '@/components/ImageGallery';
import StockIndicator from '@/components/StockIndicator';

const ProductDetailContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { data: product, isLoading, error } = useProduct(id || '');

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '/placeholder.svg',
      quantity
    });
    toast.success(`${quantity} x ${product.name} added to cart!`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? 'fill-primary text-primary'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background dark">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')} className="bg-primary text-primary-foreground">
              Go Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const specifications = product.specifications as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background dark">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: product.category?.name || 'Products', href: product.category ? `/category/${product.category.slug}` : '/products' },
              { label: product.name },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Gallery with Zoom */}
          <ImageGallery
            images={product.image_url ? [product.image_url] : []}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <Badge className="bg-primary/10 text-primary mb-3">
                  {product.category.name}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-muted-foreground">Brand: {product.brand}</p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex">{renderStars(4.5)}</div>
              <span className="text-muted-foreground">4.5 (Based on reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground">
                ৳{product.price.toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ৳{product.original_price.toLocaleString()}
                  </span>
                  <Badge variant="destructive">
                    {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status with Urgency Indicator */}
            <StockIndicator stock={product.stock} size="md" />

            <Separator />

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg bg-secondary">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-12 w-12 text-foreground hover:text-foreground hover:bg-muted"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="h-12 w-12 text-foreground hover:text-foreground hover:bg-muted"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className="h-12 w-12 bg-secondary text-foreground hover:bg-muted border border-border"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>

              <SocialShare title={product.name} description={product.description || ''} />
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-border">
                <Truck className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-border">
                <Shield className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-border">
                <Package className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Specifications and Reviews */}
        <div className="mt-16">
          <Tabs defaultValue="specifications" className="w-full">
            <TabsList className="w-full justify-start bg-card border border-border">
              <TabsTrigger value="specifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Reviews
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {specifications && Object.keys(specifications).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-3 border-b border-border last:border-0">
                          <span className="font-medium text-foreground">{key}</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No specifications available for this product.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

const ProductDetail = () => (
  <CartProvider>
    <ProductDetailContent />
  </CartProvider>
);

export default ProductDetail;
