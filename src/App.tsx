import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import Index from "./pages/Index";
import PCAccessories from "./pages/PCAccessories";
import MobileAccessories from "./pages/MobileAccessories";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Compare from "./pages/Compare";
import FlashSale from "./pages/FlashSale";

// Admin pages
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import Categories from "./pages/admin/Categories";
import Users from "./pages/admin/Users";
import SiteContent from "./pages/admin/SiteContent";
import BlogPosts from "./pages/admin/BlogPosts";
import Reviews from "./pages/admin/Reviews";
import NavbarSettings from "./pages/admin/NavbarSettings";
import Account from "./pages/Account";
import Coupons from "./pages/admin/Coupons";
import Inventory from "./pages/admin/Inventory";
import Suppliers from "./pages/admin/Suppliers";
import DesignSettings from "./pages/admin/DesignSettings";
import ShippingZones from "./pages/admin/ShippingZones";
import FlashSales from "./pages/admin/FlashSales";
import Returns from "./pages/admin/Returns";

const queryClient = new QueryClient();

// Component to apply design settings
const DesignSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  useDesignSettings();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DesignSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pc-accessories" element={<PCAccessories />} />
            <Route path="/mobile-accessories" element={<MobileAccessories />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-login" element={<AdminAuth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/flash-sale/:id" element={<FlashSale />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="users" element={<Users />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="shipping-zones" element={<ShippingZones />} />
              <Route path="flash-sales" element={<FlashSales />} />
              <Route path="returns" element={<Returns />} />
              <Route path="blog-posts" element={<BlogPosts />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="site-content" element={<SiteContent />} />
              <Route path="navbar" element={<NavbarSettings />} />
              <Route path="design" element={<DesignSettings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </DesignSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
