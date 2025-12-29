import { useEffect } from 'react';
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

export const useDesignSettings = () => {
  const queryClient = useQueryClient();
  
  const { data: settings, refetch } = useQuery({
    queryKey: ['design-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'design')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.value as unknown as DesignSettings | null;
    },
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
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

    // Apply typography - directly set font-family on elements
    if (settings.typography) {
      const headingFont = settings.typography.headingFont || 'Fredoka';
      const bodyFont = settings.typography.bodyFont || 'Nunito';
      const fontSize = settings.typography.baseFontSize || '16px';

      // Set CSS variables
      root.style.setProperty('--font-heading', `'${headingFont}', sans-serif`);
      root.style.setProperty('--font-body', `'${bodyFont}', sans-serif`);
      root.style.setProperty('--font-size-base', fontSize);

      // Directly apply to body
      document.body.style.fontFamily = `'${bodyFont}', sans-serif`;
      document.body.style.fontSize = fontSize;

      // Apply heading font to all headings via style tag
      let styleEl = document.getElementById('design-settings-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'design-settings-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        h1, h2, h3, h4, h5, h6, .font-heading {
          font-family: '${headingFont}', sans-serif !important;
        }
        body, p, span, div, input, textarea, button, a, li {
          font-family: '${bodyFont}', sans-serif;
        }
      `;
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