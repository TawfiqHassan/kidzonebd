import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF Protection: Validate URL to prevent internal network access
function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(urlString);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }
    
    // Block private IP ranges
    const privateIpPatterns = [
      /^10\./,                                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,          // 172.16.0.0/12
      /^192\.168\./,                              // 192.168.0.0/16
      /^169\.254\./,                              // Link-local
      /^0\./,                                     // 0.0.0.0/8
      /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
      /^192\.0\.0\./,                             // IETF Protocol Assignments
      /^198\.1[8-9]\./,                           // Benchmark testing
      /^fc00:/i,                                  // IPv6 private
      /^fe80:/i,                                  // IPv6 link-local
    ];
    
    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
    }
    
    // Block cloud metadata endpoints
    const metadataEndpoints = [
      '169.254.169.254',
      'metadata.google.internal',
      'metadata.goog',
    ];
    
    if (metadataEndpoints.includes(hostname)) {
      return { valid: false, error: 'Cloud metadata endpoints are not allowed' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.log('User authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is an admin
    const { data: roles, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roles) {
      console.log('Admin role check failed for user:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin user authenticated:', user.id);

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, supplierId, endpoint, apiKey, authType, headers: customHeaders } = await req.json();

    if (action === 'test') {
      // Test API connection
      if (!endpoint) {
        return new Response(
          JSON.stringify({ success: false, error: 'API endpoint is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // SSRF Protection: Validate endpoint URL
      const urlValidation = isValidExternalUrl(endpoint);
      if (!urlValidation.valid) {
        console.log('URL validation failed:', urlValidation.error);
        return new Response(
          JSON.stringify({ success: false, error: urlValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Testing API connection to:', endpoint);

      // Build headers based on auth type
      const requestHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...customHeaders,
      };

      if (apiKey) {
        switch (authType) {
          case 'bearer':
            requestHeaders['Authorization'] = `Bearer ${apiKey}`;
            break;
          case 'api_key':
            requestHeaders['X-API-Key'] = apiKey;
            break;
          case 'basic':
            requestHeaders['Authorization'] = `Basic ${btoa(apiKey)}`;
            break;
          case 'custom':
            // API key is already in custom headers
            break;
        }
      }

      try {
        // Set timeout for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          let responsePreview = '';
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            responsePreview = JSON.stringify(data, null, 2).substring(0, 500);
          } else {
            responsePreview = (await response.text()).substring(0, 500);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              status: response.status,
              message: 'Connection successful',
              preview: responsePreview
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: false, 
              status: response.status,
              error: `API returned status ${response.status}: ${response.statusText}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to connect: ${errorMessage}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'fetch_products') {
      // Fetch products from supplier API
      if (!supplierId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Supplier ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get supplier from database
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (supplierError || !supplier) {
        return new Response(
          JSON.stringify({ success: false, error: 'Supplier not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!supplier.api_endpoint) {
        return new Response(
          JSON.stringify({ success: false, error: 'Supplier has no API endpoint configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // SSRF Protection: Validate supplier endpoint
      const urlValidation = isValidExternalUrl(supplier.api_endpoint);
      if (!urlValidation.valid) {
        console.log('Supplier URL validation failed:', urlValidation.error);
        return new Response(
          JSON.stringify({ success: false, error: 'Supplier API endpoint is not allowed: ' + urlValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching products from:', supplier.name);

      // Build headers
      const requestHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(supplier.api_headers || {}),
      };

      if (supplier.api_key) {
        switch (supplier.auth_type) {
          case 'bearer':
            requestHeaders['Authorization'] = `Bearer ${supplier.api_key}`;
            break;
          case 'api_key':
            requestHeaders['X-API-Key'] = supplier.api_key;
            break;
          case 'basic':
            requestHeaders['Authorization'] = `Basic ${btoa(supplier.api_key)}`;
            break;
        }
      }

      try {
        // Set timeout for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(supplier.api_endpoint, {
          method: 'GET',
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `API returned status ${response.status}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        
        // Update last sync time
        await supabase
          .from('suppliers')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', supplierId);

        // Try to extract products array from common response structures
        let products = [];
        if (Array.isArray(data)) {
          products = data;
        } else if (data.products) {
          products = data.products;
        } else if (data.items) {
          products = data.items;
        } else if (data.data) {
          products = Array.isArray(data.data) ? data.data : [data.data];
        } else {
          products = [data];
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            products: products.slice(0, 50), // Limit to 50 products
            total: products.length,
            supplier: supplier.name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to fetch products: ${errorMessage}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
