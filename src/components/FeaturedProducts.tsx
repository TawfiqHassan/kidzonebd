import { useState } from 'react';
import { Link } from 'react-router-dom';
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

  // Sample featured products data - Kids toys theme (BDT pricing)
  const featuredProducts: Product[] = [
    {
      id: '1',
      name: 'Cuddles the Teddy Bear',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=400&h=300&fit=crop',
      category: 'Plush Toys',
      description: 'Super soft and cuddly brown teddy bear, perfect for hugs and bedtime snuggles!',
      inStock: true,
      rating: 4.9,
      reviews: 324
    },
    {
      id: '2',
      name: 'Creative Block Set 200pcs',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop',
      category: 'Building Blocks',
      description: 'Colorful building blocks in various shapes. Develops creativity and motor skills!',
      inStock: true,
      rating: 4.8,
      reviews: 256
    },
    {
      id: '3',
      name: 'Rainbow Unicorn Plush',
      price: 1799,
      image: 'https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=400&h=300&fit=crop',
      category: 'Plush Toys',
      description: 'Magical rainbow unicorn with sparkly horn and soft mane. Every child\'s dream!',
      inStock: true,
      rating: 4.9,
      reviews: 445
    },
    {
      id: '4',
      name: 'Superhero Action Set',
      price: 2199,
      image: 'https://images.unsplash.com/photo-1608278047522-58806a6fd94a?w=400&h=300&fit=crop',
      category: 'Action Figures',
      description: 'Set of 5 superhero action figures with movable joints. Save the world!',
      inStock: true,
      rating: 4.7,
      reviews: 189
    },
    {
      id: '5',
      name: 'Ultimate Art Kit',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop',
      category: 'Arts & Crafts',
      description: 'Complete art set with crayons, markers, paints, and brushes. 150+ pieces!',
      inStock: true,
      rating: 4.8,
      reviews: 167
    },
    {
      id: '6',
      name: 'STEM Science Lab',
      price: 3499,
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop',
      category: 'Educational',
      description: 'Exciting science experiments kit with 20+ experiments. Ages 6+.',
      inStock: true,
      rating: 4.9,
      reviews: 89
    }
  ];

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
            ? 'fill-brand-yellow text-brand-yellow'
            : i < rating
            ? 'fill-brand-yellow/50 text-brand-yellow'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-gradient-to-b from-brand-purple/5 to-brand-teal/5">
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
          {featuredProducts.map((product) => (
            <Card 
              key={product.id}
              className="group bg-card border-2 border-brand-yellow/20 hover:border-brand-orange/50 transition-all duration-300 hover:shadow-xl overflow-hidden rounded-2xl"
            >
              <div className="relative">
                {/* Product image */}
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>

                {/* Product badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-brand-purple text-white hover:bg-brand-purple/90 rounded-full">
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
                          ? 'fill-brand-pink text-brand-pink' 
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
                    <GitCompare className={`w-4 h-4 ${isInComparison(product.id) ? 'text-brand-teal' : ''}`} />
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
                      <h3 className="text-lg font-fredoka font-bold text-foreground mb-1 group-hover:text-brand-orange transition-colors">
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
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xl font-bold text-brand-orange">
                      ৳{product.price.toLocaleString()}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                      size="sm"
                      className="bg-brand-orange hover:bg-brand-orange-dark text-white disabled:opacity-50 rounded-full"
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
              className="bg-brand-purple hover:bg-brand-purple/90 text-white px-8 rounded-full font-bold"
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
