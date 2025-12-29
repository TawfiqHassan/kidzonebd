import { Link } from 'react-router-dom';
import { Heart, Blocks, Puzzle, Swords, Palette, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ProductCategories = () => {
  // Product categories with icons and details - Kids toys theme
  const categories = [
    {
      id: 'plush-toys',
      name: 'Plush Toys',
      icon: Heart,
      description: 'Soft & Cuddly',
      productCount: '50+',
      href: '/pc-accessories',
      color: 'text-brand-pink'
    },
    {
      id: 'building-blocks',
      name: 'Building Blocks',
      icon: Blocks,
      description: 'Creative Building',
      productCount: '60+',
      href: '/pc-accessories',
      color: 'text-brand-orange'
    },
    {
      id: 'board-games',
      name: 'Board Games',
      icon: Puzzle,
      description: 'Family Fun',
      productCount: '40+',
      href: '/pc-accessories',
      color: 'text-brand-teal'
    },
    {
      id: 'action-figures',
      name: 'Action Figures',
      icon: Swords,
      description: 'Heroes & Adventures',
      productCount: '45+',
      href: '/pc-accessories',
      color: 'text-brand-purple'
    },
    {
      id: 'arts-crafts',
      name: 'Arts & Crafts',
      icon: Palette,
      description: 'Creative Kits',
      productCount: '35+',
      href: '/mobile-accessories',
      color: 'text-brand-yellow'
    },
    {
      id: 'educational',
      name: 'Educational',
      icon: GraduationCap,
      description: 'Learn & Play',
      productCount: '55+',
      href: '/mobile-accessories',
      color: 'text-brand-green'
    }
  ];

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
            const IconComponent = category.icon;
            
            return (
              <Link key={category.id} to={category.href}>
                <Card className="group bg-card border-2 border-brand-yellow/20 hover:border-brand-orange/50 transition-all duration-300 hover:shadow-xl cursor-pointer h-full rounded-2xl">
                  <CardContent className="p-5 text-center">
                    {/* Category icon */}
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                      <IconComponent className={`w-8 h-8 ${category.color}`} />
                    </div>

                    {/* Category information */}
                    <h3 className="font-fredoka font-bold text-foreground mb-1 group-hover:text-brand-orange transition-colors">
                      {category.name}
                    </h3>
                    
                    <p className="text-muted-foreground text-xs mb-2">
                      {category.description}
                    </p>
                    
                    <div className="text-brand-orange text-sm font-bold">
                      {category.productCount}
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
