import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubMenuItem {
  name: string;
  href: string;
}

export interface MenuItem {
  name: string;
  href: string;
  children?: SubMenuItem[];
}

export interface NavbarSettings {
  menu_items: MenuItem[];
}

const defaultMenuItems: MenuItem[] = [
  { name: 'Home', href: '/' },
  { name: 'All Toys', href: '/pc-accessories' },
  { name: 'New Arrivals', href: '/mobile-accessories' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' }
];

export const useNavbarSettings = () => {
  return useQuery({
    queryKey: ['navbar-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'navbar')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        const settings = data.value as unknown as NavbarSettings;
        return settings.menu_items || defaultMenuItems;
      }

      return defaultMenuItems;
    },
    // Aggressive refetching for instant updates
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  });
};
