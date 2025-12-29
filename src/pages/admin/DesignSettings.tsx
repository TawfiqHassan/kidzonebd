import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Palette, Type, Image, Save, RotateCcw } from 'lucide-react';

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

const defaultSettings: DesignSettings = {
  colors: {
    primary: '15 95% 55%',
    primaryForeground: '0 0% 100%',
    accent: '175 70% 45%',
    background: '45 100% 98%',
    foreground: '260 30% 20%',
    brandGold: '15 95% 55%',
    brandGoldDark: '15 95% 45%',
  },
  typography: {
    headingFont: 'Fredoka',
    bodyFont: 'Nunito',
    baseFontSize: '16px',
  },
  branding: {
    logoUrl: '',
    faviconUrl: '',
    siteName: 'KidZone',
  },
};

const fontOptions = [
  { value: 'Fredoka', label: 'Fredoka' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
];

const fontSizeOptions = [
  { value: '14px', label: 'Small (14px)' },
  { value: '16px', label: 'Medium (16px)' },
  { value: '18px', label: 'Large (18px)' },
];

// Color presets for quick selection - KidZone themed
const colorPresets = [
  { name: 'KidZone Orange', primary: '15 95% 55%', accent: '175 70% 45%' },
  { name: 'Playful Purple', primary: '270 60% 60%', accent: '330 80% 65%' },
  { name: 'Ocean Teal', primary: '175 70% 45%', accent: '145 60% 50%' },
  { name: 'Sunny Yellow', primary: '45 100% 60%', accent: '15 95% 55%' },
  { name: 'Candy Pink', primary: '330 80% 65%', accent: '270 60% 60%' },
  { name: 'Forest Green', primary: '145 60% 50%', accent: '175 70% 45%' },
  { name: 'Royal Blue', primary: '210 100% 50%', accent: '270 60% 60%' },
  { name: 'Cherry Red', primary: '0 84% 60%', accent: '330 80% 65%' },
];

const AdminDesignSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<DesignSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: savedSettings, isLoading } = useQuery({
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
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...savedSettings });
    }
  }, [savedSettings]);

  // Apply preview styles
  useEffect(() => {
    if (previewMode) {
      const root = document.documentElement;
      root.style.setProperty('--primary', settings.colors.primary);
      root.style.setProperty('--accent', settings.colors.accent);
      root.style.setProperty('--brand-gold', settings.colors.brandGold);
      root.style.setProperty('--brand-gold-dark', settings.colors.brandGoldDark);
    }
    return () => {
      if (previewMode) {
        // Reset to defaults when leaving preview
        const root = document.documentElement;
        root.style.removeProperty('--primary');
        root.style.removeProperty('--accent');
        root.style.removeProperty('--brand-gold');
        root.style.removeProperty('--brand-gold-dark');
      }
    };
  }, [previewMode, settings.colors]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'design',
          value: settings as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Design settings saved! Changes applied site-wide.');
      setPreviewMode(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleColorChange = (key: keyof DesignSettings['colors'], value: string) => {
    setSettings(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
    setPreviewMode(true);
  };

  const handleTypographyChange = (key: keyof DesignSettings['typography'], value: string) => {
    setSettings(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  };

  const handleBrandingChange = (key: keyof DesignSettings['branding'], value: string) => {
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, [key]: value },
    }));
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        primary: preset.primary,
        accent: preset.accent,
        brandGold: preset.primary,
        brandGoldDark: preset.primary,
      },
    }));
    setPreviewMode(true);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setPreviewMode(false);
    toast.info('Reset to default settings');
  };

  // Convert HSL string to hex for color input
  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design Settings</h1>
          <p className="text-muted-foreground">Customize your site's appearance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {previewMode && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-3 text-sm text-amber-500">
          Preview mode active - changes are being previewed. Click "Save Changes" to apply permanently.
        </div>
      )}

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          {/* Color Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Color Presets</CardTitle>
              <CardDescription>Quick color schemes to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-lg border border-border hover:border-primary transition-colors text-left"
                  >
                    <div 
                      className="w-full h-8 rounded mb-2"
                      style={{ backgroundColor: `hsl(${preset.primary})` }}
                    />
                    <span className="text-sm font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Colors</CardTitle>
              <CardDescription>Fine-tune individual color values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color (Brand Gold)</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={hslToHex(settings.colors.primary)}
                      onChange={(e) => handleColorChange('primary', hexToHsl(e.target.value))}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={settings.colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      placeholder="45 100% 50%"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={hslToHex(settings.colors.accent)}
                      onChange={(e) => handleColorChange('accent', hexToHsl(e.target.value))}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={settings.colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      placeholder="45 100% 50%"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={hslToHex(settings.colors.background)}
                      onChange={(e) => handleColorChange('background', hexToHsl(e.target.value))}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={settings.colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      placeholder="220 20% 97%"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Foreground (Text) Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={hslToHex(settings.colors.foreground)}
                      onChange={(e) => handleColorChange('foreground', hexToHsl(e.target.value))}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={settings.colors.foreground}
                      onChange={(e) => handleColorChange('foreground', e.target.value)}
                      placeholder="222.2 84% 4.9%"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-lg border border-border">
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    style={{ 
                      backgroundColor: `hsl(${settings.colors.primary})`,
                      color: `hsl(${settings.colors.primaryForeground})`
                    }}
                  >
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline"
                    style={{ borderColor: `hsl(${settings.colors.primary})`, color: `hsl(${settings.colors.primary})` }}
                  >
                    Outline Button
                  </Button>
                  <div 
                    className="px-4 py-2 rounded"
                    style={{ 
                      backgroundColor: `hsl(${settings.colors.background})`,
                      color: `hsl(${settings.colors.foreground})`,
                      border: '1px solid hsl(var(--border))'
                    }}
                  >
                    Text Sample
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Font Settings</CardTitle>
              <CardDescription>Choose fonts for your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select
                    value={settings.typography.headingFont}
                    onValueChange={(value) => handleTypographyChange('headingFont', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select
                    value={settings.typography.bodyFont}
                    onValueChange={(value) => handleTypographyChange('bodyFont', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Base Font Size</Label>
                  <Select
                    value={settings.typography.baseFontSize}
                    onValueChange={(value) => handleTypographyChange('baseFontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontSizeOptions.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Typography Preview */}
              <div className="mt-6 p-4 rounded-lg border border-border">
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="space-y-2">
                  <h1 
                    className="text-3xl font-bold"
                    style={{ fontFamily: settings.typography.headingFont }}
                  >
                    Heading Example
                  </h1>
                  <h2 
                    className="text-2xl font-semibold"
                    style={{ fontFamily: settings.typography.headingFont }}
                  >
                    Subheading Example
                  </h2>
                  <p 
                    style={{ 
                      fontFamily: settings.typography.bodyFont,
                      fontSize: settings.typography.baseFontSize 
                    }}
                  >
                    This is a paragraph showing how body text will appear on your website. 
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Branding</CardTitle>
              <CardDescription>Upload your logo and set site identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.branding.siteName}
                  onChange={(e) => handleBrandingChange('siteName', e.target.value)}
                  placeholder="TiqBud"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.branding.logoUrl}
                  onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your logo image. Recommended size: 200x60px
                </p>
                {settings.branding.logoUrl && (
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm mb-2">Preview:</p>
                    <img 
                      src={settings.branding.logoUrl} 
                      alt="Logo preview" 
                      className="max-h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={settings.branding.faviconUrl}
                  onChange={(e) => handleBrandingChange('faviconUrl', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your favicon. Recommended size: 32x32px
                </p>
                {settings.branding.faviconUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm">Preview:</p>
                    <img 
                      src={settings.branding.faviconUrl} 
                      alt="Favicon preview" 
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDesignSettings;