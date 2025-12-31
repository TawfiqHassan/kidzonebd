import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  shippingAddress: string;
  city: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderData: OrderNotificationRequest = await req.json();
    console.log("Received order notification request:", orderData);

    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    console.log(`Found ${adminRoles?.length || 0} admin users`);

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create in-app notifications for all admins
    const notifications = adminRoles.map((admin) => ({
      user_id: admin.user_id,
      title: "New Order Received",
      message: `Order #${orderData.orderNumber} from ${orderData.customerName} - ৳${orderData.total.toLocaleString()}`,
      type: "order",
      link: `/admin/orders?order=${orderData.orderId}`,
      is_read: false,
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error creating notifications:", notifError);
    } else {
      console.log(`Created ${notifications.length} in-app notifications`);
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map((r) => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("user_id", adminUserIds);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
    }

    // Send email notifications to admins with valid emails
    const adminEmails = adminProfiles
      ?.filter((p) => p.email && p.email.includes("@"))
      .map((p) => p.email) || [];

    console.log(`Sending email to ${adminEmails.length} admin emails`);

    if (adminEmails.length > 0) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>New Order Notification</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🛒 New Order Received!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #f97316; margin-top: 0;">Order #${orderData.orderNumber}</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Customer:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.customerPhone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Items:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.itemCount} item(s)</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #f97316; font-weight: bold;">৳${orderData.total.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Payment:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : orderData.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Shipping:</strong></td>
                    <td style="padding: 8px 0;">${orderData.shippingAddress}, ${orderData.city}</td>
                  </tr>
                </table>
              </div>
              
              <p style="text-align: center; color: #666; margin-bottom: 0;">
                Log in to your admin dashboard to view and process this order.
              </p>
            </div>
            
            <div style="background: #1f2937; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                This is an automated notification from TiqBud Store
              </p>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "TiqBud Store <onboarding@resend.dev>",
          to: adminEmails,
          subject: `🛒 New Order #${orderData.orderNumber} - ৳${orderData.total.toLocaleString()}`,
          html: emailHtml,
        });

        console.log("Admin email notification sent:", emailResponse);
      } catch (emailError: any) {
        console.error("Error sending admin email:", emailError);
        // Don't fail if email fails, we still have in-app notifications
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsCreated: notifications.length,
        emailsSent: adminEmails.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-admin-new-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
