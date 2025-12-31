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

export interface HeaderStyle {
  layout: 'default' | 'centered' | 'minimal';
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  logoPosition: 'left' | 'center';
  showSearchInHeader: boolean;
  stickyHeader: boolean;
}

export interface NavbarSettings {
  menu_items: MenuItem[];
  header_style?: HeaderStyle;
}

const defaultMenuItems: MenuItem[] = [
  { name: 'Home', href: '/' },
  { name: 'All Toys', href: '/pc-accessories' },
  { name: 'New Arrivals', href: '/mobile-accessories' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' }
];

const defaultHeaderStyle: HeaderStyle = {
  layout: 'default',
  backgroundColor: '',
  textColor: '',
  borderColor: '',
  logoPosition: 'left',
  showSearchInHeader: true,
  stickyHeader: true,
};

const fetchNavbarSettings = async (): Promise<NavbarSettings> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'navbar')
    .maybeSingle();

  if (error) throw error;

  if (data?.value) {
    const settings = data.value as unknown as NavbarSettings;
    return {
      menu_items: settings.menu_items || defaultMenuItems,
      header_style: settings.header_style ? { ...defaultHeaderStyle, ...settings.header_style } : defaultHeaderStyle,
    };
  }

  return {
    menu_items: defaultMenuItems,
    header_style: defaultHeaderStyle,
  };
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

  const query = useQuery({
    queryKey: ['navbar-settings-public'],
    queryFn: fetchNavbarSettings,
    staleTime: 0,
  });

  return {
    ...query,
    menuItems: query.data?.menu_items || defaultMenuItems,
    headerStyle: query.data?.header_style || defaultHeaderStyle,
  };
};
