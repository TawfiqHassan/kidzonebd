import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Star, X } from 'lucide-react';
import { toast } from 'sonner';

interface SearchResultsProps {
  searchQuery: string;
  onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchQuery, onClose }) => {
  const { data: products, isLoading } = useProducts({ search: searchQuery, limit: 10 });
  const { addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || '/placeholder.svg'
    });
    toast.success(`${product.name} added to cart`);
  };

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString('en-BD')}`;
  };

  if (!searchQuery.trim()) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {isLoading ? 'Searching...' : `${products?.length || 0} results for "${searchQuery}"`}
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : products && products.length > 0 ? (
        <div className="p-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <Link to={`/product/${product.id}`} onClick={onClose} className="shrink-0">
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/product/${product.id}`} 
                  onClick={onClose}
                  className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary font-bold">
                    {formatPrice(Number(product.price))}
                  </span>
                  {product.original_price && Number(product.original_price) > Number(product.price) && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(Number(product.original_price))}
                    </span>
                  )}
                </div>
                {product.category && (
                  <span className="text-xs text-muted-foreground">
                    {product.category.name}
                  </span>
                )}
              </div>
              
              <Button 
                size="sm" 
                onClick={() => handleAddToCart(product)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No products found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SearchResults;
