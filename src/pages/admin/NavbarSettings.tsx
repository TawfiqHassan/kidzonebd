import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, GripVertical, Menu, ChevronDown, ChevronRight, Palette } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubMenuItem {
  name: string;
  href: string;
}

interface MenuItem {
  name: string;
  href: string;
  children?: SubMenuItem[];
}

interface HeaderStyle {
  layout: 'default' | 'centered' | 'minimal';
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  logoPosition: 'left' | 'center';
  showSearchInHeader: boolean;
  stickyHeader: boolean;
}

interface NavbarSettings {
  menu_items: MenuItem[];
  header_style?: HeaderStyle;
}

const defaultHeaderStyle: HeaderStyle = {
  layout: 'default',
  backgroundColor: '',
  textColor: '',
  borderColor: '',
  logoPosition: 'left',
  showSearchInHeader: true,
  stickyHeader: true,
};

const AdminNavbarSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>(defaultHeaderStyle);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['navbar-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'navbar')
        .maybeSingle();
      
      if (error) throw error;
      return data?.value as unknown as NavbarSettings | null;
    }
  });

  useEffect(() => {
    if (settings?.menu_items) {
      setMenuItems(settings.menu_items);
    } else {
      setMenuItems([
        { name: 'Home', href: '/' },
        { name: 'All Toys', href: '/all-toys' },
        { name: 'New Arrivals', href: '/new-arrivals' },
        { name: 'Blog & Reviews', href: '/blog' },
        { name: 'Contact', href: '/contact' }
      ]);
    }
    if (settings?.header_style) {
      setHeaderStyle({ ...defaultHeaderStyle, ...settings.header_style });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { items: MenuItem[]; style: HeaderStyle }) => {
      const valueData = { menu_items: data.items, header_style: data.style } as unknown as Json;
      
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'navbar')
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            value: valueData,
            is_public: true,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'navbar');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ 
            key: 'navbar', 
            value: valueData,
            is_public: true
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar-settings'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-settings-public'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success('Navbar settings saved');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const handleAddItem = () => {
    setMenuItems([...menuItems, { name: '', href: '', children: [] }]);
  };

  const handleRemoveItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: 'name' | 'href', value: string) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
  };

  const handleAddSubItem = (parentIndex: number) => {
    const updated = [...menuItems];
    if (!updated[parentIndex].children) {
      updated[parentIndex].children = [];
    }
    updated[parentIndex].children!.push({ name: '', href: '' });
    setMenuItems(updated);
    
    // Expand the parent item
    const itemKey = `item-${parentIndex}`;
    if (!expandedItems.includes(itemKey)) {
      setExpandedItems([...expandedItems, itemKey]);
    }
  };

  const handleRemoveSubItem = (parentIndex: number, childIndex: number) => {
    const updated = [...menuItems];
    updated[parentIndex].children = updated[parentIndex].children?.filter((_, i) => i !== childIndex);
    setMenuItems(updated);
  };

  const handleUpdateSubItem = (parentIndex: number, childIndex: number, field: 'name' | 'href', value: string) => {
    const updated = [...menuItems];
    if (updated[parentIndex].children) {
      updated[parentIndex].children![childIndex] = {
        ...updated[parentIndex].children![childIndex],
        [field]: value
      };
    }
    setMenuItems(updated);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menuItems.length) return;
    
    const updated = [...menuItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setMenuItems(updated);
  };

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems(prev => 
      prev.includes(itemKey) 
        ? prev.filter(k => k !== itemKey) 
        : [...prev, itemKey]
    );
  };

  const handleSave = () => {
    const validItems = menuItems.filter(item => item.name.trim() && item.href.trim()).map(item => ({
      ...item,
      children: item.children?.filter(child => child.name.trim() && child.href.trim()) || []
    }));
    if (validItems.length === 0) {
      toast.error('Add at least one menu item');
      return;
    }
    saveMutation.mutate({ items: validItems, style: headerStyle });
  };

  const updateHeaderStyle = (key: keyof HeaderStyle, value: string | boolean) => {
    setHeaderStyle(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Navbar Settings</h1>
          <p className="text-muted-foreground">Customize navigation menu items, layout, and colors</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="menu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Header Style
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Menu Items
              </CardTitle>
              <CardDescription>
                Add menu items and optional sub-menu items. Sub-menus appear as dropdowns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {menuItems.map((item, index) => {
            const itemKey = `item-${index}`;
            const isExpanded = expandedItems.includes(itemKey);
            const hasChildren = item.children && item.children.length > 0;
            
            return (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-3 bg-secondary/50">
                  <div className="flex flex-col gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === menuItems.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                        placeholder="Menu label"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Link</Label>
                      <Input
                        value={item.href}
                        onChange={(e) => handleUpdateItem(index, 'href', e.target.value)}
                        placeholder="/page-url"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAddSubItem(index)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Sub-item
                  </Button>
                  
                  {hasChildren && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => toggleExpanded(itemKey)}
                      className="shrink-0"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Sub-items */}
                {hasChildren && isExpanded && (
                  <div className="p-3 pl-14 bg-background space-y-2 border-t border-border">
                    <Label className="text-xs text-muted-foreground font-medium">Sub-menu items (dropdown):</Label>
                    {item.children?.map((child, childIndex) => (
                      <div key={childIndex} className="flex items-center gap-3 p-2 bg-secondary/30 rounded">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            value={child.name}
                            onChange={(e) => handleUpdateSubItem(index, childIndex, 'name', e.target.value)}
                            placeholder="Sub-item label"
                            className="h-9"
                          />
                          <Input
                            value={child.href}
                            onChange={(e) => handleUpdateSubItem(index, childIndex, 'href', e.target.value)}
                            placeholder="/sub-page-url"
                            className="h-9"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRemoveSubItem(index, childIndex)}
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Header Style
              </CardTitle>
              <CardDescription>
                Customize the header layout, colors, and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Layout Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Layout</Label>
                  <Select
                    value={headerStyle.layout}
                    onValueChange={(value) => updateHeaderStyle('layout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Logo left, nav center)</SelectItem>
                      <SelectItem value="centered">Centered (Logo center, nav below)</SelectItem>
                      <SelectItem value="minimal">Minimal (Logo left, nav right)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Logo Position</Label>
                  <Select
                    value={headerStyle.logoPosition}
                    onValueChange={(value) => updateHeaderStyle('logoPosition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={headerStyle.backgroundColor || '#ffffff'}
                      onChange={(e) => updateHeaderStyle('backgroundColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={headerStyle.backgroundColor}
                      onChange={(e) => updateHeaderStyle('backgroundColor', e.target.value)}
                      placeholder="e.g. #ffffff or empty for default"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={headerStyle.textColor || '#000000'}
                      onChange={(e) => updateHeaderStyle('textColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={headerStyle.textColor}
                      onChange={(e) => updateHeaderStyle('textColor', e.target.value)}
                      placeholder="e.g. #000000 or empty for default"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={headerStyle.borderColor || '#e5e7eb'}
                      onChange={(e) => updateHeaderStyle('borderColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={headerStyle.borderColor}
                      onChange={(e) => updateHeaderStyle('borderColor', e.target.value)}
                      placeholder="e.g. #e5e7eb or empty for default"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Search in Header</Label>
                    <p className="text-sm text-muted-foreground">Display search bar in the header</p>
                  </div>
                  <Button
                    variant={headerStyle.showSearchInHeader ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateHeaderStyle('showSearchInHeader', !headerStyle.showSearchInHeader)}
                  >
                    {headerStyle.showSearchInHeader ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Sticky Header</Label>
                    <p className="text-sm text-muted-foreground">Header stays visible while scrolling</p>
                  </div>
                  <Button
                    variant={headerStyle.stickyHeader ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateHeaderStyle('stickyHeader', !headerStyle.stickyHeader)}
                  >
                    {headerStyle.stickyHeader ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              {/* Clear Colors Button */}
              <Button
                variant="outline"
                onClick={() => setHeaderStyle(defaultHeaderStyle)}
                className="w-full"
              >
                Reset to Default Styles
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNavbarSettings;
