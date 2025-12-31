import React from 'react';
import { Link } from 'react-router-dom';
import { useProductComparison } from '@/hooks/useProductComparison';
import { Button } from '@/components/ui/button';
import { X, GitCompare } from 'lucide-react';

const ComparisonBar: React.FC = () => {
  const { comparisonProducts, removeFromComparison, comparisonCount } = useProductComparison();

  if (comparisonCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              <span className="font-medium">Compare ({comparisonCount}/4)</span>
            </div>
            
            <div className="flex items-center gap-2">
              {comparisonProducts.map(cp => (
                <div key={cp.id} className="relative group">
                  <img
                    src={cp.product?.image_url || '/placeholder.svg'}
                    alt={cp.product?.name}
                    className="w-12 h-12 object-cover rounded border border-border"
                  />
                  <button
                    onClick={() => removeFromComparison(cp.product_id)}
                    className="absolute -top-1 -right-1 p-0.5 bg-destructive rounded-full text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Link to="/compare">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Compare Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
