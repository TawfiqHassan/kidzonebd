import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationRequest {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: string;
  city: string;
  paymentMethod: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Order confirmation email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderConfirmationRequest = await req.json();
    console.log("Sending order confirmation to:", data.customerEmail);

    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">৳${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const paymentMethodLabels: Record<string, string> = {
      'cod': 'Cash on Delivery',
      'bkash': 'bKash',
      'nagad': 'Nagad',
      'sslcommerz': 'SSLCommerz'
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #eab308); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🧸 KidZone</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Order Confirmation</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">Thank you for your order, ${data.customerName}!</h2>
              
              <p style="color: #6b7280;">Your order has been received and is being processed. Here are your order details:</p>
              
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
                <p style="margin: 5px 0 0 0; color: #f97316; font-size: 24px; font-weight: bold; font-family: monospace;">#${data.orderNumber}</p>
              </div>
              
              <h3 style="color: #1f2937; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Order Items</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px;">Item</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 14px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Subtotal</span>
                  <span style="color: #1f2937;">৳${data.subtotal.toLocaleString()}</span>
                </div>
                ${data.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #22c55e;">Discount</span>
                  <span style="color: #22c55e;">-৳${data.discount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Shipping</span>
                  <span style="color: #1f2937;">${data.shipping === 0 ? 'Free' : `৳${data.shipping}`}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb; margin-top: 10px;">
                  <span style="color: #1f2937; font-weight: bold; font-size: 18px;">Total</span>
                  <span style="color: #f97316; font-weight: bold; font-size: 18px;">৳${data.total.toLocaleString()}</span>
                </div>
              </div>
              
              <h3 style="color: #1f2937; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 30px;">Shipping Details</h3>
              
              <p style="color: #6b7280; margin: 0;">
                <strong style="color: #1f2937;">${data.customerName}</strong><br>
                ${data.shippingAddress}<br>
                ${data.city}
              </p>
              
              <p style="color: #6b7280; margin-top: 15px;">
                <strong>Payment Method:</strong> ${paymentMethodLabels[data.paymentMethod] || data.paymentMethod}
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Track Your Order:</strong> You can track your order status anytime by visiting our website and entering your order number and email.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://kidzone.com'}/track-order?order=${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #eab308); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Track Your Order
                </a>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                  Thank you for shopping with KidZone! 🧸
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
                  If you have any questions, please contact us at hello@kidzone.com.bd
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "KidZone <onboarding@resend.dev>",
      to: [data.customerEmail],
      subject: `Order Confirmed! #${data.orderNumber} - KidZone`,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
