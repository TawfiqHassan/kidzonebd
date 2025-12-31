import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  FolderOpen,
  UserCog,
  Layout,
  FileText,
  Star,
  Tag,
  AlertTriangle,
  Truck,
  Palette,
  Zap,
  RotateCcw,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/logo.png';

const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categories' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/inventory', icon: AlertTriangle, label: 'Inventory Alerts' },
    { path: '/admin/returns', icon: RotateCcw, label: 'Returns & Refunds' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/users', icon: UserCog, label: 'User Management' },
    { path: '/admin/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
    { path: '/admin/flash-sales', icon: Zap, label: 'Flash Sales' },
    { path: '/admin/shipping-zones', icon: MapPin, label: 'Shipping Zones' },
    { path: '/admin/blog-posts', icon: FileText, label: 'Blog Posts' },
    { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin/site-content', icon: Layout, label: 'Site Content' },
    { path: '/admin/navbar', icon: Menu, label: 'Store Navbar' },
    { path: '/admin/design', icon: Palette, label: 'Store Design' },
    { path: '/admin/settings', icon: Settings, label: 'Store Settings' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics & Reports' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="TiqBud" className="h-10 w-auto" />
              {isSidebarOpen && <span className="font-bold text-lg">Admin</span>}
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive(item.path, item.exact) 
                    ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              {isSidebarOpen && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hidden lg:flex"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Admin</span>
                {location.pathname !== '/admin' && (
                  <>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="capitalize">
                      {location.pathname.split('/').pop()}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Link to="/">
                <Button variant="outline" size="sm">
                  View Store
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
