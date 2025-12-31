import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download, X } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderDetails {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  coupon_code: string | null;
}

interface OrderInvoiceProps {
  order: OrderDetails;
  items: OrderItem[];
  isOpen: boolean;
  onClose: () => void;
}

const OrderInvoice: React.FC<OrderInvoiceProps> = ({ order, items, isOpen, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // HTML escape function to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Clone the content and sanitize it
    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    
    // Remove any script tags that might have been injected
    const scripts = clonedContent.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove event handlers and dangerous attributes
    const allElements = clonedContent.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove all event handler attributes
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    const sanitizedHTML = clonedContent.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px;
              color: #333;
              background: white;
            }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f0b429; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #f0b429; }
            .company-tagline { font-size: 12px; color: #666; }
            .invoice-title { font-size: 24px; color: #333; text-align: right; }
            .invoice-number { font-size: 14px; color: #666; }
            .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-block { flex: 1; }
            .info-block h3 { font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
            .info-block p { font-size: 14px; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #dee2e6; }
            td { padding: 12px; border-bottom: 1px solid #dee2e6; font-size: 14px; }
            .text-right { text-align: right; }
            .totals { margin-top: 20px; }
            .totals-row { display: flex; justify-content: flex-end; padding: 8px 0; }
            .totals-label { width: 150px; color: #666; }
            .totals-value { width: 120px; text-align: right; font-weight: 500; }
            .grand-total { font-size: 18px; font-weight: bold; color: #f0b429; border-top: 2px solid #f0b429; padding-top: 12px; margin-top: 8px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #666; font-size: 12px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${sanitizedHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    handlePrint();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white text-foreground p-6">
          <div className="invoice-container">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-primary">
              <div>
                <h1 className="text-2xl font-bold text-primary">TechGadgets BD</h1>
                <p className="text-sm text-muted-foreground">Premium PC & Mobile Accessories</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold">INVOICE</h2>
                <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {/* Customer & Order Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Bill To</h3>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                {order.customer_phone && (
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                )}
              </div>
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Ship To</h3>
                <p className="text-sm">{order.shipping_address}</p>
                <p className="text-sm">
                  {order.city}
                  {order.district && `, ${order.district}`}
                  {order.postal_code && ` - ${order.postal_code}`}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex gap-8 mb-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Payment Method:</span>
                <span className="ml-2 text-sm font-medium capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Payment Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  order.payment_status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 text-xs uppercase tracking-wide">Product</th>
                  <th className="text-center p-3 text-xs uppercase tracking-wide">Qty</th>
                  <th className="text-right p-3 text-xs uppercase tracking-wide">Unit Price</th>
                  <th className="text-right p-3 text-xs uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="p-3">{item.product_name}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">{formatPrice(item.unit_price)}</td>
                    <td className="p-3 text-right font-medium">{formatPrice(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-primary mt-2">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>Thank you for your purchase!</p>
              <p className="mt-1">For any queries, contact us at support@techgadgetsbd.com</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderInvoice;
