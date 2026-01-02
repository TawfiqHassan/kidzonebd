import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, ShoppingCart, Heart, Eye, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/context/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductComparison } from '@/hooks/useProductComparison';
import { toast } from 'sonner';

const FeaturedProducts = () => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToComparison, isInComparison } = useProductComparison();

  // Fetch featured products from database
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.image_url || 'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=400&h=300&fit=crop&fm=webp&q=80',
        category: p.category?.name || 'Toys',
        description: p.description || 'A wonderful toy for kids!',
        inStock: p.stock > 0,
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 300) + 50,
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
      })) as Product[];
    }
  });

  // Fallback products if none in database
  const fallbackProducts: Product[] = [
    {
      id: 'demo-1',
      name: 'Cuddles the Teddy Bear',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=400&h=300&fit=crop&fm=webp&q=80',
      category: 'Plush Toys',
      description: 'Super soft and cuddly brown teddy bear, perfect for hugs and bedtime snuggles!',
      inStock: true,
      rating: 4.9,
      reviews: 324
    },
    {
      id: 'demo-2',
      name: 'Creative Block Set 200pcs',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop&fm=webp&q=80',
      category: 'Building Blocks',
      description: 'Colorful building blocks in various shapes. Develops creativity and motor skills!',
      inStock: true,
      rating: 4.8,
      reviews: 256
    },
    {
      id: 'demo-3',
      name: 'Rainbow Unicorn Plush',
      price: 1799,
      image: 'https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=400&h=300&fit=crop&fm=webp&q=80',
      category: 'Plush Toys',
      description: 'Magical rainbow unicorn with sparkly horn and soft mane. Every child\'s dream!',
      inStock: true,
      rating: 4.9,
      reviews: 445
    },
    {
      id: 'demo-4',
      name: 'Superhero Action Set',
      price: 2199,
      image: 'https://images.unsplash.com/photo-1608278047522-58806a6fd94a?w=400&h=300&fit=crop&fm=webp&q=80',
      category: 'Action Figures',
      description: 'Set of 5 superhero action figures with movable joints. Save the world!',
      inStock: true,
      rating: 4.7,
      reviews: 189
    },
    {
      id: 'demo-5',
      name: 'Ultimate Art Kit',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop&fm=webp&q=80',
      category: 'Arts & Crafts',
      description: 'Complete art set with crayons, markers, paints, and brushes. 150+ pieces!',
      inStock: true,
      rating: 4.8,
      reviews: 167
    },
    {
      id: 'demo-6',
      name: 'STEM Science Lab',
      price: 3499,
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&fm=webp&q=80',
      category: 'Educational',
      description: 'Exciting science experiments kit with 20+ experiments. Ages 6+.',
      inStock: true,
      rating: 4.9,
      reviews: 89
    }
  ];

  const products = featuredProducts.length > 0 ? featuredProducts : fallbackProducts;

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-primary text-primary'
            : i < rating
            ? 'fill-primary/50 text-primary'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-fredoka font-bold text-foreground mb-3">
              ⭐ Featured Toys
            </h2>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-fredoka font-bold text-foreground mb-3">
            ⭐ Featured Toys
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular and highest-rated toys for kids!
          </p>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card 
              key={product.id}
              className="group bg-card border-2 border-primary/20 hover:border-accent/50 transition-all duration-300 hover:shadow-xl overflow-hidden rounded-2xl"
            >
              <div className="relative">
                {/* Product image */}
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </Link>

                {/* Product badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                    {product.category}
                  </Badge>
                  {!product.inStock && (
                    <Badge variant="destructive" className="rounded-full">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                {/* Action buttons overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleWishlist(product.id)}
                    className="w-10 h-10 p-0 rounded-full"
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        isInWishlist(product.id) 
                          ? 'fill-destructive text-destructive' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => addToComparison(product.id)}
                    disabled={isInComparison(product.id)}
                    className="w-10 h-10 p-0 rounded-full"
                  >
                    <GitCompare className={`w-4 h-4 ${isInComparison(product.id) ? 'text-accent' : ''}`} />
                  </Button>
                  <Link to={`/product/${product.id}`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 p-0 rounded-full"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Product info */}
                <div className="space-y-3">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-fredoka font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Rating and reviews */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {renderStars(product.rating || 4.5)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(product.rating || 4.5).toFixed(1)} ({product.reviews} reviews)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xl font-bold text-primary">
                      ৳{product.price.toLocaleString()}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 rounded-full"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {product.inStock ? 'Add' : 'Out'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/pc-accessories">
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 rounded-full font-bold"
            >
              🎁 View All Toys
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;