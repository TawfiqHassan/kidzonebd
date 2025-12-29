import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Truck, Shield, Gift } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-br from-brand-yellow/20 via-background to-brand-pink/10">
      {/* Decorative floating shapes */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-brand-teal/20 rounded-full blur-xl animate-bounce-gentle"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-brand-purple/20 rounded-full blur-xl animate-bounce-gentle" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-brand-yellow/30 rounded-full blur-lg animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-brand-orange">
                <Star className="w-6 h-6 fill-current animate-wiggle" />
                <span className="text-sm font-bold uppercase tracking-wide">The Best Toys for Happy Kids!</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-fredoka font-bold text-foreground leading-tight">
                Welcome to
                <span className="text-brand-orange block">
                  KidZone! 🎉
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Discover amazing toys, games, and adventures for kids of all ages! 
                From cuddly plushies to exciting building sets - fun awaits!
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pc-accessories">
                <Button 
                  size="lg" 
                  className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                >
                  Shop Toys
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              <Link to="/contact">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white px-8 font-bold rounded-full w-full sm:w-auto"
                >
                  Contact Us
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 bg-brand-teal/20 rounded-full">
                  <Truck className="w-5 h-5 text-brand-teal" />
                </div>
                <span className="text-sm font-semibold">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 bg-brand-green/20 rounded-full">
                  <Shield className="w-5 h-5 text-brand-green" />
                </div>
                <span className="text-sm font-semibold">Safe & Quality</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 bg-brand-pink/20 rounded-full">
                  <Gift className="w-5 h-5 text-brand-pink" />
                </div>
                <span className="text-sm font-semibold">Gift Wrapping</span>
              </div>
            </div>
          </div>

          {/* Right side - Hero image/graphics */}
          <div className="relative">
            <div className="relative z-10">
              <div className="bg-card rounded-3xl p-6 shadow-2xl border-4 border-brand-yellow/30">
                <img
                  src="https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&h=400&fit=crop"
                  alt="Happy Kids Playing with Toys"
                  className="w-full h-72 object-cover rounded-2xl"
                />
                
                {/* Floating product cards */}
                <div className="absolute -top-4 -left-4 bg-brand-purple text-white p-4 rounded-2xl shadow-lg transform rotate-3">
                  <div className="text-sm font-bold">🧸 Plush Toys</div>
                  <div className="text-xs font-semibold">From ৳999</div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-brand-teal text-white p-4 rounded-2xl shadow-lg transform -rotate-3">
                  <div className="text-sm font-bold">🎮 Games</div>
                  <div className="text-xs font-semibold">50+ Options</div>
                </div>
              </div>
            </div>

            {/* Background decorative element */}
            <div className="absolute inset-0 bg-brand-orange/10 rounded-3xl blur-3xl transform rotate-6"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
