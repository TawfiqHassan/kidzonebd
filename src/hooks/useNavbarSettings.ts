import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
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

const fetchNavbarSettings = async (): Promise<MenuItem[]> => {
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
};

export const useNavbarSettings = () => {
  const queryClient = useQueryClient();

  const invalidateNavbar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['navbar-settings-public'] });
  }, [queryClient]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('navbar-settings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.navbar'
        },
        invalidateNavbar
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateNavbar]);

  return useQuery({
    queryKey: ['navbar-settings-public'],
    queryFn: fetchNavbarSettings,
    staleTime: 0,
  });
};
