import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DesignSettings {
  colors: {
    primary: string;
    primaryForeground: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: string;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    siteName: string;
  };
}

const fetchDesignSettings = async (): Promise<DesignSettings | null> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'design')
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value as unknown as DesignSettings | null;
};

export const useDesignSettings = () => {
  const queryClient = useQueryClient();

  const invalidateDesign = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['design-settings'] });
  }, [queryClient]);

  // Subscribe to realtime changes for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('design-settings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.design'
        },
        invalidateDesign
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateDesign]);
  
  const { data: settings, refetch } = useQuery({
    queryKey: ['design-settings'],
    queryFn: fetchDesignSettings,
    staleTime: 0,
  });

  // Apply design settings to CSS variables
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply colors
    if (settings.colors) {
      if (settings.colors.primary) {
        root.style.setProperty('--primary', settings.colors.primary);
        root.style.setProperty('--ring', settings.colors.primary);
      }
      if (settings.colors.primaryForeground) {
        root.style.setProperty('--primary-foreground', settings.colors.primaryForeground);
      }
      if (settings.colors.accent) {
        root.style.setProperty('--accent', settings.colors.accent);
      }
      if (settings.colors.background) {
        root.style.setProperty('--background', settings.colors.background);
      }
      if (settings.colors.foreground) {
        root.style.setProperty('--foreground', settings.colors.foreground);
      }
    }

    // Apply typography (store as CSS variables; storefront scopes will consume them)
    if (settings.typography) {
      const headingFont = settings.typography.headingFont || 'Fredoka';
      const bodyFont = settings.typography.bodyFont || 'Nunito';
      const fontSize = settings.typography.baseFontSize || '16px';

      const quote = (name: string) => (name.includes(' ') ? `"${name}"` : name);

      root.style.setProperty(
        '--font-heading',
        `${quote(headingFont)}, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`
      );
      root.style.setProperty(
        '--font-body',
        `${quote(bodyFont)}, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`
      );
      root.style.setProperty('--font-size-base', fontSize);
    }

    // Apply branding
    if (settings.branding) {
      if (settings.branding.siteName) {
        document.title = settings.branding.siteName;
      }
      if (settings.branding.faviconUrl) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.head.appendChild(link);
        }
        link.type = 'image/x-icon';
        link.href = settings.branding.faviconUrl;
      }
    }
  }, [settings]);

  return { settings, refetch };
};