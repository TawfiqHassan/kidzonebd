import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Blocks, Puzzle, Swords, Palette, GraduationCap, Grid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Icon mapping for categories
const iconMap: Record<string, any> = {
  'plush-toys': Heart,
  'building-blocks': Blocks,
  'board-games': Puzzle,
  'action-figures': Swords,
  'arts-crafts': Palette,
  'educational-toys': GraduationCap,
};

// Color mapping for categories
const colorMap: Record<string, string> = {
  'plush-toys': 'text-primary',
  'building-blocks': 'text-accent',
  'board-games': 'text-secondary-foreground',
  'action-figures': 'text-accent',
  'arts-crafts': 'text-primary',
  'educational-toys': 'text-secondary-foreground',
};

const ProductCategories = () => {
  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-grid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) return [];
      return data;
    }
  });

  // Fetch product counts per category
  const { data: productCounts = {} } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true);
      
      if (error) return {};
      
      const counts: Record<string, number> = {};
      data.forEach(p => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  const getIcon = (slug: string) => iconMap[slug] || Grid;
  const getColor = (slug: string) => colorMap[slug] || 'text-primary';

  return (
    <section className="py-16 bg-card/50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-fredoka font-bold text-foreground mb-3">
            🎈 Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing toys for every little adventurer!
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const IconComponent = getIcon(category.slug);
            const colorClass = getColor(category.slug);
            const count = productCounts[category.id] || 0;
            
            return (
              <Link key={category.id} to={`/pc-accessories?category=${category.id}`}>
                <Card className="group bg-card border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer h-full rounded-2xl">
                  <CardContent className="p-5 text-center">
                    {/* Category icon */}
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                      <IconComponent className={`w-8 h-8 ${colorClass}`} />
                    </div>

                    {/* Category information */}
                    <h3 className="font-fredoka font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    
                    <p className="text-muted-foreground text-xs mb-2">
                      {category.description || 'Fun for all ages'}
                    </p>
                    
                    <div className="text-primary text-sm font-bold">
                      {count > 0 ? `${count} items` : 'Coming soon'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;