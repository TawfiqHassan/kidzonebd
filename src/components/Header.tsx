import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, ChevronDown, User, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useNavbarSettings, MenuItem } from '@/hooks/useNavbarSettings';
import CartDrawer from './CartDrawer';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { data: siteSettings } = useSiteSettings();
  const { menuItems, headerStyle } = useNavbarSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const announcement = siteSettings?.announcement_bar;

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const hasChildren = (item: MenuItem): boolean => {
    return !!(item.children && item.children.length > 0);
  };

  // Search products from database
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .ilike('name', `%${searchQuery}%`)
          .eq('is_active', true)
          .limit(6);

        if (error) throw error;
        setSearchResults(data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductClick = (productId: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  // Build custom header styles
  const customStyles: React.CSSProperties = {
    ...(headerStyle.backgroundColor ? { backgroundColor: headerStyle.backgroundColor } : {}),
    ...(headerStyle.textColor ? { color: headerStyle.textColor } : {}),
    ...(headerStyle.borderColor ? { borderColor: headerStyle.borderColor } : {}),
  };

  const isCenteredLayout = headerStyle.layout === 'centered';
  const isMinimalLayout = headerStyle.layout === 'minimal';
  const isCenteredLogo = headerStyle.logoPosition === 'center';

  // Render navigation items
  const renderNavItems = () => (
    <>
      {menuItems.map((item) => (
        <NavigationMenuItem key={item.name}>
          {hasChildren(item) ? (
            <>
              <NavigationMenuTrigger className={`bg-transparent font-semibold ${isActive(item.href) ? 'text-primary' : 'text-foreground/80 hover:text-primary'}`}>
                {item.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-48 gap-1 p-2 bg-card border-2 border-primary/30 rounded-xl">
                  {item.children?.map((child) => (
                    <li key={child.name}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={child.href}
                          className="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary font-medium"
                        >
                          {child.name}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </>
          ) : (
            <Link
              to={item.href}
              className={`px-4 py-2 font-semibold transition-colors duration-200 ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-foreground/80 hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          )}
        </NavigationMenuItem>
      ))}
    </>
  );

  // Render search bar
  const renderSearchBar = (className?: string) => (
    <div className={className} ref={searchRef}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent w-4 h-4" />
        <Input
          type="text"
          placeholder="Search toys..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          className="pl-10 bg-secondary border-2 border-accent/20 focus:border-primary rounded-full"
        />
        
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-primary/30 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left rounded-xl m-1"
                >
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-sm font-bold text-primary">${product.price.toLocaleString()}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">No toys found 🧸</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render action buttons (notifications, user, cart, menu toggle)
  const renderActionButtons = () => (
    <div className="flex items-center space-x-2">
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative text-foreground hover:text-primary hover:bg-primary/10 rounded-full"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto rounded-2xl border-2 border-primary/30">
            {notifications.length > 0 ? (
              notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                  className={`flex flex-col items-start gap-1 cursor-pointer rounded-xl ${!notification.is_read ? 'bg-primary/10' : ''}`}
                >
                  <span className="font-semibold">{notification.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{notification.message}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No notifications 📭
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(user ? '/account' : '/auth')}
        className="text-foreground hover:text-primary hover:bg-primary/10 rounded-full"
      >
        <User className="w-5 h-5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCartOpen(true)}
        className="relative text-foreground hover:text-primary hover:bg-primary/10 rounded-full"
      >
        <ShoppingCart className="w-5 h-5" />
        {getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {getTotalItems()}
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden text-foreground hover:text-primary hover:bg-primary/10 rounded-full"
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
    </div>
  );

  // Render mobile menu
  const renderMobileMenu = () => (
    isMenuOpen && (
      <div className="lg:hidden mt-4 pb-4 border-t-2 border-primary/30">
        <div className="flex flex-col space-y-2 mt-4">
          {headerStyle.showSearchInHeader && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent w-4 h-4" />
              <Input
                type="text"
                placeholder="Search toys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-2 border-accent/20 rounded-full"
              />
            </div>
          )}
          
          {menuItems.map((item) => (
            <div key={item.name}>
              {hasChildren(item) ? (
                <div>
                  <button
                    onClick={() => setExpandedMobile(expandedMobile === item.name ? null : item.name)}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary/20 text-primary font-bold'
                        : 'text-foreground hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    {item.name}
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedMobile === item.name ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedMobile === item.name && (
                    <div className="pl-4 space-y-1 mt-1">
                      {item.children?.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 px-4 text-muted-foreground hover:text-primary transition-colors rounded-lg"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-3 px-4 rounded-xl transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary/20 text-primary font-bold'
                      : 'text-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <>
      {/* Top announcement bar */}
      {announcement?.is_visible !== false && (
        <div className="bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground text-center py-2 text-sm font-bold">
          <Sparkles className="inline-block w-4 h-4 mr-2 animate-wiggle" />
          {announcement?.message || '🎁 ঢাকায় ৳৫,০০০+ অর্ডারে ফ্রি ডেলিভারি!'} 
          <Sparkles className="inline-block w-4 h-4 ml-2 animate-wiggle" />
        </div>
      )}

      <header 
        className={`bg-card/95 backdrop-blur-sm border-b-4 border-primary/30 ${headerStyle.stickyHeader ? 'sticky top-0' : ''} z-50`}
        style={customStyles}
      >
        <div className="container mx-auto px-4 py-3">
          {isCenteredLayout ? (
            /* Centered Layout */
            <div className="flex flex-col items-center gap-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-3xl">🧸</span>
                <span className="text-2xl font-fredoka font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  KidZone
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <NavigationMenu className="hidden lg:flex">
                  <NavigationMenuList>
                    {renderNavItems()}
                  </NavigationMenuList>
                </NavigationMenu>

                {headerStyle.showSearchInHeader && renderSearchBar("hidden md:flex items-center")}
                {renderActionButtons()}
              </div>
            </div>
          ) : (
            /* Default and Minimal Layouts */
            <div className="flex items-center justify-between">
              <Link to="/" className={`flex items-center space-x-2 ${isCenteredLogo ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
                <span className="text-3xl">🧸</span>
                <span className="text-2xl font-fredoka font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  KidZone
                </span>
              </Link>

              <NavigationMenu className={`hidden lg:flex ${isMinimalLayout ? 'ml-auto mr-4' : ''}`}>
                <NavigationMenuList>
                  {renderNavItems()}
                </NavigationMenuList>
              </NavigationMenu>

              {headerStyle.showSearchInHeader && renderSearchBar("hidden md:flex items-center space-x-4 flex-1 max-w-sm mx-6")}
              {renderActionButtons()}
            </div>
          )}

          {renderMobileMenu()}
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;