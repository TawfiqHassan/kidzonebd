import Header from '@/components/Header';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import Hero from '@/components/Hero';
import ProductCategories from '@/components/ProductCategories';
import FeaturedProducts from '@/components/FeaturedProducts';
import RecentlyViewed from '@/components/RecentlyViewed';
import ComparisonBar from '@/components/ComparisonBar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';

const Index = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background font-nunito">
        {/* Header with navigation and cart */}
        <Header />
        
        {/* Flash sale banner */}
        <FlashSaleBanner />
        
        {/* Hero section with main banner */}
        <Hero />
        
        {/* Product categories section */}
        <ProductCategories />
        
        {/* Featured products section */}
        <FeaturedProducts />
        
        {/* Recently viewed products */}
        <RecentlyViewed />
        
        {/* Product comparison bar */}
        <ComparisonBar />
        
        {/* Footer */}
        <Footer />
      </div>
    </CartProvider>
  );
};

export default Index;
