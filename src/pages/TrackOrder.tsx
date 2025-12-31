import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  city: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  order_items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-500/20 text-purple-700 border-purple-500/30', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500/20 text-green-700 border-green-500/30', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-700 border-red-500/30', icon: XCircle },
};

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      toast.error('Please enter both order number and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setSearched(true);

    try {
      // Search by order ID (partial match on the beginning) and email
      const cleanOrderNumber = orderNumber.replace('#', '').trim().toLowerCase();
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          payment_status,
          payment_method,
          customer_name,
          customer_email,
          shipping_address,
          city,
          subtotal,
          shipping_cost,
          discount,
          total,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .ilike('customer_email', email.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter orders that match the order number (first 8 chars of UUID)
      const matchingOrder = data?.find(o => 
        o.id.toLowerCase().startsWith(cleanOrderNumber) ||
        o.id.slice(0, 8).toLowerCase() === cleanOrderNumber
      );

      if (matchingOrder) {
        setOrder(matchingOrder as unknown as Order);
      } else {
        setOrder(null);
        toast.error('No order found with this information');
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'cod': 'Cash on Delivery',
      'bkash': 'bKash',
      'nagad': 'Nagad',
      'sslcommerz': 'SSLCommerz'
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Track Your Order</h1>
            <p className="text-muted-foreground mt-2">
              Enter your order number and email to check the status of your order
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC12345"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Searching...'
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Details */}
          {searched && !isLoading && (
            <>
              {order ? (
                <div className="space-y-6">
                  {/* Order Status Card */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Number</p>
                          <CardTitle className="text-xl font-mono text-primary">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                        </div>
                        <Badge className={`${getStatusInfo(order.status).color} border`}>
                          {getStatusInfo(order.status).label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Status Timeline */}
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 z-0" />
                        {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                          const StatusIcon = getStatusInfo(status).icon;
                          const isActive = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                          const isCancelled = order.status === 'cancelled';
                          
                          return (
                            <div key={status} className="relative z-10 flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isCancelled 
                                  ? 'bg-muted text-muted-foreground' 
                                  : isActive 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                <StatusIcon className="w-5 h-5" />
                              </div>
                              <span className={`text-xs mt-2 ${isActive && !isCancelled ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {getStatusInfo(status).label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Order Date</p>
                          <p className="font-medium">{format(new Date(order.created_at), 'PPP p')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Method</p>
                          <p className="font-medium">{getPaymentMethodLabel(order.payment_method)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Status</p>
                          <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Shipping Address</p>
                          <p className="font-medium">{order.shipping_address}, {order.city}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                ৳{item.unit_price.toLocaleString()} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">৳{item.total_price.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>৳{order.subtotal.toLocaleString()}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-৳{order.discount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{order.shipping_cost === 0 ? 'Free' : `৳${order.shipping_cost}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">৳{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                    <p className="text-muted-foreground mb-6">
                      We couldn't find an order with the provided information. Please check and try again.
                    </p>
                    <Button variant="outline" onClick={() => { setSearched(false); setOrder(null); }}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Need help with your order? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrackOrder;
