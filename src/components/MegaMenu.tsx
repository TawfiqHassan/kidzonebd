import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Laptop, Smartphone, Headphones, Camera, Watch, Gamepad2 } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'pc-accessories': <Laptop className="w-5 h-5" />,
  'mobile-accessories': <Smartphone className="w-5 h-5" />,
  'audio': <Headphones className="w-5 h-5" />,
  'cameras': <Camera className="w-5 h-5" />,
  'wearables': <Watch className="w-5 h-5" />,
  'gaming': <Gamepad2 className="w-5 h-5" />,
};

const MegaMenu = ({ isOpen, onClose }: MegaMenuProps) => {
  const { data: categories = [] } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Group categories by parent
  const parentCategories = categories.filter(c => !c.parent_category);
  const childCategories = categories.filter(c => c.parent_category);

  const getChildrenForParent = (parentSlug: string) => {
    return childCategories.filter(c => c.parent_category === parentSlug);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Mega Menu */}
      <div className="fixed top-[120px] left-0 right-0 bg-card border-b border-border shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left - Categories List */}
            <div className="col-span-3 border-r border-border pr-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Categories</h3>
              <ul className="space-y-1">
                {parentCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      onMouseEnter={() => setActiveCategory(category.slug)}
                      onClick={() => {
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left",
                        activeCategory === category.slug
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {categoryIcons[category.slug] || <Laptop className="w-5 h-5" />}
                        {category.name}
                      </span>
                      {getChildrenForParent(category.slug).length > 0 && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Middle - Subcategories */}
            <div className="col-span-5">
              {activeCategory && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {parentCategories.find(c => c.slug === activeCategory)?.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {getChildrenForParent(activeCategory).length > 0 ? (
                      getChildrenForParent(activeCategory).map((child) => (
                        <Link
                          key={child.id}
                          to={`/category/${child.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                        >
                          {child.image_url && (
                            <img 
                              src={child.image_url} 
                              alt={child.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                              {child.name}
                            </span>
                            {child.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {child.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="col-span-2 text-muted-foreground">
                        <Link
                          to={`/category/${activeCategory}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          View all products
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!activeCategory && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Hover over a category to see subcategories</p>
                </div>
              )}
            </div>

            {/* Right - Featured / Promo */}
            <div className="col-span-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Featured Deals</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Check out our latest deals and offers on top tech products.
              </p>
              <div className="space-y-3">
                <Link
                  to="/all-toys"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-card/80 transition-colors group"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Laptop className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground group-hover:text-primary">All Toys</span>
                    <p className="text-sm text-muted-foreground">Up to 30% off</p>
                  </div>
                </Link>
                <Link
                  to="/new-arrivals"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-card/80 transition-colors group"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground group-hover:text-primary">New Arrivals</span>
                    <p className="text-sm text-muted-foreground">Latest toys</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MegaMenu;
