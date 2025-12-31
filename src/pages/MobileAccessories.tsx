import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, ShoppingCart, Heart, Eye, Grid, Heart as HeartIcon, Blocks, Puzzle, Swords, Palette, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import ProductFilters from '@/components/ProductFilters';

// Extended product type for this page
interface ProductWithExtras {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  originalPrice?: number;
  brand?: string;
}

interface FilterState {
  priceRange: [number, number];
  brands: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
}

// Icon mapping for toy categories
const iconMap: Record<string, any> = {
  'plush-toys': HeartIcon,
  'building-blocks': Blocks,
  'board-games': Puzzle,
  'action-figures': Swords,
  'arts-crafts': Palette,
  'educational-toys': GraduationCap,
};

const MobileAccessoriesContent = () => {
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100000],
    brands: [],
    inStockOnly: false,
    onSaleOnly: false
  });

  // Fetch ALL toy categories
  const { data: categories = [] } = useQuery({
    queryKey: ['toy-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) return [];
      return data;
    }
  });

  // Fetch newest products from database (sorted by created_at desc)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['new-arrivals', activeCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('is_active', true);

      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory);
      }

      // Get newest products first
      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop',
        category: p.category?.slug || 'uncategorized',
        description: p.description || '',
        inStock: p.stock > 0,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 50,
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        brand: p.brand || undefined,
      })) as ProductWithExtras[];
    }
  });

  // Get available brands and max price
  const availableBrands = useMemo(() => {
    const brands = products.map(p => p.brand).filter((b): b is string => !!b);
    return [...new Set(brands)].sort();
  }, [products]);

  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 100000);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }
      // Brand filter
      if (filters.brands.length > 0 && (!product.brand || !filters.brands.includes(product.brand))) {
        return false;
      }
      // In stock filter
      if (filters.inStockOnly && !product.inStock) {
        return false;
      }
      // On sale filter
      if (filters.onSaleOnly && (!product.originalPrice || product.originalPrice <= product.price)) {
        return false;
      }
      return true;
    });
  }, [products, filters]);

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      default: return 0; // newest - already sorted from query
    }
  });

  const handleAddToCart = (product: ProductWithExtras) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-primary text-primary'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const getIcon = (slug: string) => {
    const key = slug.toLowerCase();
    return iconMap[key] || Grid;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-accent/10 via-card to-primary/10 border-b-4 border-accent py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-fredoka font-bold text-foreground">
              New Arrivals
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Check out our latest toys and games - fresh from the toy factory!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories & Filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-4">
            {/* Categories */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Grid className="w-4 h-4" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  All New Arrivals
                </button>
                {categories.map((cat) => {
                  const IconComponent = getIcon(cat.slug);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <ProductFilters
              availableBrands={availableBrands}
              maxPrice={maxPrice}
              onFilterChange={setFilters}
              initialFilters={filters}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Showing {sortedProducts.length} new products
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No new arrivals in this category yet!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="group bg-card border-2 border-primary/20 hover:border-accent/50 transition-all duration-300 overflow-hidden rounded-2xl"
                  >
                    <div className="relative">
                      <Link to={`/product/${product.id}`}>
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>

                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className="bg-accent text-accent-foreground">
                          New
                        </Badge>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <Badge className="bg-destructive text-destructive-foreground">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                          </Badge>
                        )}
                        {!product.inStock && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleFavorite(product.id)}
                          className="w-9 h-9 p-0"
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              favorites.includes(product.id) 
                                ? 'fill-destructive text-destructive' 
                                : ''
                            }`} 
                          />
                        </Button>
                        <Link to={`/product/${product.id}`}>
                          <Button size="sm" variant="secondary" className="w-9 h-9 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-fredoka font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex">{renderStars(product.rating || 4.5)}</div>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-foreground">
                            ৳{product.price.toLocaleString()}
                          </div>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="text-sm text-muted-foreground line-through">
                              ৳{product.originalPrice.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const MobileAccessories = () => (
  <CartProvider>
    <MobileAccessoriesContent />
  </CartProvider>
);

export default MobileAccessories;