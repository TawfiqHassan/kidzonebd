import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, MapPin, Tag, X, Check, ShoppingBag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
  valid_until: string | null;
}

const CheckoutContent = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  
  // Get user safely - AuthContext may not be available
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // AuthContext not available
  }
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    city: 'Dhaka',
    district: '',
    postalCode: '',
    paymentMethod: 'cod',
    notes: ''
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone, city')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setFormData(prev => ({
            ...prev,
            customerName: profile.full_name || '',
            customerEmail: profile.email || user.email || '',
            customerPhone: profile.phone || '',
            city: profile.city || 'Dhaka'
          }));
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const subtotal = getTotalPrice();
  const shippingCost = subtotal >= 5000 ? 0 : 100;
  const total = subtotal - discount + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast.error('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      // Check validity
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        toast.error('This coupon has expired');
        setCouponLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) {
        toast.error('This coupon has reached its usage limit');
        setCouponLoading(false);
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        toast.error(`Minimum order amount is ৳${coupon.min_order_amount.toLocaleString()}`);
        setCouponLoading(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round(subtotal * (coupon.discount_value / 100));
      } else {
        discountAmount = coupon.discount_value;
      }

      setAppliedCoupon(coupon);
      setDiscount(discountAmount);
      toast.success(`Coupon applied! You saved ৳${discountAmount.toLocaleString()}`);
    } catch (error) {
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    // Basic validation
    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.customerPhone.trim() || !formData.shippingAddress.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.customerEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order - works for both logged in users and guests
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          customer_name: formData.customerName.trim(),
          customer_email: formData.customerEmail.trim(),
          customer_phone: formData.customerPhone.trim(),
          shipping_address: formData.shippingAddress.trim(),
          city: formData.city,
          district: formData.district || null,
          postal_code: formData.postalCode || null,
          payment_method: formData.paymentMethod,
          notes: formData.notes || null,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          discount: discount,
          coupon_id: appliedCoupon?.id || null,
          coupon_code: appliedCoupon?.code || null,
          total: total,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Record coupon usage if coupon was applied (only for logged in users)
      if (appliedCoupon && user) {
        await supabase
          .from('coupon_usage')
          .insert({
            coupon_id: appliedCoupon.id,
            user_id: user.id,
            order_id: order.id
          });

        // Update coupon used_count
        await supabase
          .from('coupons')
          .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Send order confirmation email
      try {
        const emailPayload = {
          customerName: formData.customerName.trim(),
          customerEmail: formData.customerEmail.trim(),
          orderNumber: order.id.slice(0, 8).toUpperCase(),
          orderId: order.id,
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: subtotal,
          shipping: shippingCost,
          discount: discount,
          total: total,
          shippingAddress: formData.shippingAddress.trim(),
          city: formData.city,
          paymentMethod: formData.paymentMethod
        };

        await supabase.functions.invoke('send-order-confirmation', {
          body: emailPayload
        });
        console.log('Order confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the order if email fails
      }

      clearCart();
      setOrderNumber(order.id.slice(0, 8).toUpperCase());
      setOrderId(order.id);
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-4">
              Thank you for your order. We'll contact you shortly to confirm.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-mono font-bold text-primary">#{orderNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation has been sent to your email. You can track your order status using the order number.
            </p>
            <div className="flex flex-col gap-3">
              <Link to={`/track-order?order=${orderId}`} className="w-full">
                <Button 
                  variant="outline"
                  className="w-full"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Track Your Order
                </Button>
              </Link>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
              {user && (
                <Button 
                  variant="outline"
                  onClick={() => navigate('/account')} 
                  className="w-full"
                >
                  View My Orders
                </Button>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue Shopping
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        {/* Guest checkout notice */}
        {!user && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Checking out as guest.</span> You don't need an account to place an order. 
              We'll send order updates to your email.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Contact Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      required
                      placeholder="+880 1XXX-XXXXXX"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shippingAddress">Street Address *</Label>
                    <Textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleChange}
                      required
                      placeholder="House, Road, Area"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Coupon Code
                </h2>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-semibold text-foreground">{appliedCoupon.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {appliedCoupon.discount_type === 'percentage' 
                            ? `${appliedCoupon.discount_value}% off` 
                            : `৳${appliedCoupon.discount_value} off`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Method
                </h2>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <span className="font-medium">Cash on Delivery</span>
                      <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="bkash" id="bkash" />
                    <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                      <span className="font-medium">bKash</span>
                      <p className="text-sm text-muted-foreground">Pay via bKash mobile banking</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="nagad" id="nagad" />
                    <Label htmlFor="nagad" className="flex-1 cursor-pointer">
                      <span className="font-medium">Nagad</span>
                      <p className="text-sm text-muted-foreground">Pay via Nagad mobile banking</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors bg-accent/5">
                    <RadioGroupItem value="sslcommerz" id="sslcommerz" />
                    <Label htmlFor="sslcommerz" className="flex-1 cursor-pointer">
                      <span className="font-medium">SSLCommerz</span>
                      <p className="text-sm text-muted-foreground">Pay with Cards, Mobile Banking, Net Banking (Coming Soon)</p>
                    </Label>
                  </div>
                </RadioGroup>
                {formData.paymentMethod === 'sslcommerz' && (
                  <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                    <p className="text-sm text-accent-foreground">
                      ⚠️ SSLCommerz integration is being configured. Please use another payment method for now.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="bg-card rounded-lg border border-border p-6">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special instructions for delivery..."
                  className="mt-2"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
              >
                {isSubmitting ? 'Placing Order...' : `Place Order - ৳${total.toLocaleString()}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-foreground mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                      <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-foreground">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount</span>
                    <span>-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : `৳${shippingCost}`}</span>
                </div>
                {subtotal < 5000 && (
                  <p className="text-xs text-muted-foreground">
                    Free shipping on orders over ৳5,000
                  </p>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">৳{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const Checkout = () => (
  <CartProvider>
    <CheckoutContent />
  </CartProvider>
);

export default Checkout;
