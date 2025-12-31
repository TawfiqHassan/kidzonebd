import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Package, MapPin, Heart, User, Plus, Trash2, Edit, Camera, Save, ChevronDown, ChevronUp, Lock, RefreshCcw, FileText } from 'lucide-react';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';
import OrderInvoice from '@/components/OrderInvoice';
import OrderCancellation from '@/components/OrderCancellation';
import ReturnRequest from '@/components/ReturnRequest';
import { CartProvider, useCart } from '@/context/CartContext';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  coupon_code: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  is_default: boolean;
}

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

const AccountContent: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<OrderItem[]>([]);
  const { addToCart } = useCart();
  
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    is_default: false
  });
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    username: ''
  });

  // Fetch orders with items
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user
  });

  // Fetch order items for reorder functionality
  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, unit_price')
      .eq('order_id', orderId);
    if (error) throw error;
    return data;
  };

  // Fetch addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['my-addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user
  });

  // Fetch wishlist
  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['my-wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          products:product_id (id, name, price, image_url)
        `)
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((item: any) => ({
        ...item,
        product: item.products
      })) as WishlistItem[];
    },
    enabled: !!user
  });

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user
  });

  // Update profile form when profile loads
  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        username: profile.username || ''
      });
    }
  }, [profile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          city: data.city || null,
          username: data.username || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  // Avatar upload handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Address mutations
  const saveAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('customer_addresses')
          .update({
            label: data.label,
            full_name: data.full_name,
            phone: data.phone || null,
            address: data.address,
            city: data.city,
            district: data.district || null,
            postal_code: data.postal_code || null,
            is_default: data.is_default
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_addresses')
          .insert([{
            user_id: user?.id,
            label: data.label,
            full_name: data.full_name,
            phone: data.phone || null,
            address: data.address,
            city: data.city,
            district: data.district || null,
            postal_code: data.postal_code || null,
            is_default: data.is_default
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success('Address saved');
      resetAddressForm();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success('Address deleted');
    }
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wishlist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-wishlist'] });
      toast.success('Removed from wishlist');
    }
  });

  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      full_name: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      postal_code: '',
      is_default: false
    });
    setEditingAddress(null);
    setIsAddressDialogOpen(false);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone || '',
      address: address.address,
      city: address.city,
      district: address.district || '',
      postal_code: address.postal_code || '',
      is_default: address.is_default
    });
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.full_name || !addressForm.address || !addressForm.city) {
      toast.error('Please fill required fields');
      return;
    }
    saveAddressMutation.mutate(editingAddress ? { ...addressForm, id: editingAddress.id } : addressForm);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setIsPasswordDialogOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Reorder handler
  const handleReorder = async (orderId: string) => {
    try {
      const items = await fetchOrderItems(orderId);
      if (!items || items.length === 0) {
        toast.error('No items found in this order');
        return;
      }

      for (const item of items) {
        if (item.product_id) {
          // Fetch product details
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product_id)
            .single();

          if (product && product.is_active && product.stock > 0) {
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image_url || '',
              quantity: Math.min(item.quantity, product.stock)
            });
          }
        }
      }

      toast.success('Items added to cart');
      navigate('/checkout');
    } catch (error: any) {
      toast.error('Failed to reorder: ' + error.message);
    }
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    processing: 'bg-blue-500/20 text-blue-500',
    shipped: 'bg-purple-500/20 text-purple-500',
    delivered: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500'
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to view your account.</p>
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Login / Sign Up
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 p-6 bg-card rounded-lg border border-border">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isUploadingAvatar ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile?.full_name || 'Welcome!'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            {profile?.username && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            <div className="flex gap-2 mt-3">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  Admin Dashboard
                </Button>
              )}
            </div>
          </div>
          
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your personal details</CardDescription>
                </div>
                {!isEditingProfile ? (
                  <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+880 1XXX-XXXXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder="Dhaka"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email (cannot be changed)</Label>
                      <Input value={user.email || ''} disabled className="bg-muted" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-4 max-w-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Username</Label>
                        <p className="font-medium">{profile?.username ? `@${profile.username}` : 'Not set'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p className="font-medium">{profile?.phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">City</Label>
                        <p className="font-medium">{profile?.city || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Member Since</Label>
                        <p className="font-medium">{formatDate(profile?.created_at || user.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          minLength={6}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          minLength={6}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track your orders and view order details</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div key={order.id} className="border rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-left">
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                                <Badge className={statusColors[order.status] || ''}>
                                  {order.status}
                                </Badge>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t bg-muted/30">
                              <OrderStatusTimeline 
                                status={order.status} 
                                createdAt={order.created_at} 
                              />
                              <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="text-sm font-medium mb-2">Delivery Address</h4>
                                <p className="text-sm text-muted-foreground">
                                  {order.customer_name}<br />
                                  {order.shipping_address}<br />
                                  {order.city}
                                </p>
                              </div>
                              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-muted-foreground">Payment Status</p>
                                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                                    {order.payment_status}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Total</p>
                                  <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                                </div>
                              </div>
                              
                              {/* Invoice, Cancellation & Reorder Buttons */}
                              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const { data: items } = await supabase
                                      .from('order_items')
                                      .select('*')
                                      .eq('order_id', order.id);
                                    setInvoiceItems(items || []);
                                    setInvoiceOrder(order);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Invoice
                                </Button>
                                
                                <OrderCancellation 
                                  orderId={order.id} 
                                  orderStatus={order.status} 
                                />
                                
                                <ReturnRequest 
                                  orderId={order.id} 
                                  orderStatus={order.status}
                                  orderTotal={order.total}
                                />
                                
                                {order.status === 'delivered' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => handleReorder(order.id)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                  >
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Reorder
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet</p>
                    <Link to="/" className="text-primary hover:underline">Start shopping</Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Saved Addresses</CardTitle>
                  <CardDescription>Manage your delivery addresses</CardDescription>
                </div>
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Label</Label>
                          <Input
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            placeholder="Home, Office, etc."
                          />
                        </div>
                        <div>
                          <Label>Full Name *</Label>
                          <Input
                            value={addressForm.full_name}
                            onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Address *</Label>
                        <Input
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City *</Label>
                          <Input
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>District</Label>
                          <Input
                            value={addressForm.district}
                            onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={resetAddressForm}>Cancel</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          Save
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {addressesLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : addresses && addresses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {addresses.map((address) => (
                      <div key={address.id} className="p-4 border rounded-lg relative">
                        {address.is_default && (
                          <Badge className="absolute top-2 right-2">Default</Badge>
                        )}
                        <p className="font-medium">{address.label}</p>
                        <p className="text-sm">{address.full_name}</p>
                        <p className="text-sm text-muted-foreground">{address.address}</p>
                        <p className="text-sm text-muted-foreground">{address.city}{address.district ? `, ${address.district}` : ''}</p>
                        {address.phone && <p className="text-sm text-muted-foreground">{address.phone}</p>}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => handleEditAddress(address)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteAddressMutation.mutate(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No saved addresses</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <Card>
              <CardHeader>
                <CardTitle>My Wishlist</CardTitle>
                <CardDescription>Products you've saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : wishlist && wishlist.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg flex gap-4">
                        <img
                          src={item.product?.image_url || '/placeholder.svg'}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium line-clamp-2">{item.product?.name}</p>
                          <p className="text-primary font-bold">{formatPrice(item.product?.price || 0)}</p>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="mt-2"
                            onClick={() => removeFromWishlistMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Your wishlist is empty</p>
                    <Link to="/" className="text-primary hover:underline">Browse products</Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invoice Modal */}
        {invoiceOrder && (
          <OrderInvoice
            order={invoiceOrder}
            items={invoiceItems}
            isOpen={!!invoiceOrder}
            onClose={() => setInvoiceOrder(null)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

const Account: React.FC = () => (
  <CartProvider>
    <AccountContent />
  </CartProvider>
);

export default Account;
