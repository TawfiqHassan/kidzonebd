import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();

  // Handle checkout process
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    onClose();
    window.location.href = '/checkout';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Shopping Cart</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cart content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-280px)]">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add some products to get started</p>
              <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-secondary rounded-lg p-4 border border-border">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate text-sm">
                        {item.name}
                      </h4>
                      <p className="text-base font-bold text-primary">
                        ৳{item.price.toLocaleString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 p-0 border-border"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <span className="text-foreground font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0 border-border"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="text-foreground font-bold">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full mt-4 border-destructive text-destructive hover:bg-destructive/10"
              >
                Clear Cart
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-border p-6 space-y-4 bg-card">
            <div className="flex items-center justify-between text-xl font-bold text-foreground">
              <span>Total:</span>
              <span className="text-primary">৳{getTotalPrice().toLocaleString()}</span>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
            >
              Proceed to Checkout
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-border"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;