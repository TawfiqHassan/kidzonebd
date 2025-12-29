import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DesignSettings {
  colors: {
    primary: string;
    primaryForeground: string;
    accent: string;
    background: string;
    foreground: string;
    brandGold: string;
    brandGoldDark: string;
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

export const useDesignSettings = () => {
  const { data: settings } = useQuery({
    queryKey: ['design-settings-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'design')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.value as unknown as DesignSettings | null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Apply design settings to CSS variables
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply colors
    if (settings.colors) {
      if (settings.colors.primary) {
        root.style.setProperty('--primary', settings.colors.primary);
        root.style.setProperty('--brand-orange', settings.colors.primary);
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

    // Apply typography
    if (settings.typography) {
      if (settings.typography.headingFont) {
        root.style.setProperty('--font-heading', `'${settings.typography.headingFont}', sans-serif`);
      }
      if (settings.typography.bodyFont) {
        root.style.setProperty('--font-body', `'${settings.typography.bodyFont}', sans-serif`);
        document.body.style.fontFamily = `'${settings.typography.bodyFont}', sans-serif`;
      }
      if (settings.typography.baseFontSize) {
        root.style.setProperty('--font-size-base', settings.typography.baseFontSize);
      }
    }

    // Apply branding
    if (settings.branding) {
      if (settings.branding.siteName) {
        document.title = settings.branding.siteName;
      }
      if (settings.branding.faviconUrl) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = settings.branding.faviconUrl;
        document.head.appendChild(link);
      }
    }
  }, [settings]);

  return settings;
};
