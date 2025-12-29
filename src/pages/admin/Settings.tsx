import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface SiteSettings {
  announcement: {
    text: string;
    enabled: boolean;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    whatsapp: string;
    tiktok: string;
  };
}

const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings>({
    announcement: { text: '', enabled: true },
    contact: { phone: '', email: '', address: '' },
    social: { facebook: '', instagram: '', youtube: '', whatsapp: '', tiktok: '' }
  });

  const { data: siteSettings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      
      return settingsMap as Record<string, any>;
    }
  });

  useEffect(() => {
    if (siteSettings) {
      setSettings({
        announcement: siteSettings.announcement || { text: '', enabled: true },
        contact: siteSettings.contact || { phone: '', email: '', address: '' },
        social: siteSettings.social || { facebook: '', instagram: '', youtube: '', whatsapp: '', tiktok: '' }
      });
    }
  }, [siteSettings]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: SiteSettings) => {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ 
            key: update.key, 
            value: update.value,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'key' 
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Bar</CardTitle>
              <CardDescription>Configure the announcement bar shown at the top of your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="announcement-enabled"
                  checked={settings.announcement.enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ 
                      ...settings, 
                      announcement: { ...settings.announcement, enabled: checked } 
                    })
                  }
                />
                <Label htmlFor="announcement-enabled">Show announcement bar</Label>
              </div>
              <div>
                <Label htmlFor="announcement-text">Announcement Text</Label>
                <Input
                  id="announcement-text"
                  value={settings.announcement.text}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      announcement: { ...settings.announcement, text: e.target.value } 
                    })
                  }
                  placeholder="🎉 Free Delivery on orders over ৳5,000!"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your store's contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.contact.phone}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      contact: { ...settings.contact, phone: e.target.value } 
                    })
                  }
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.contact.email}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      contact: { ...settings.contact, email: e.target.value } 
                    })
                  }
                  placeholder="support@tiqbud.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={settings.contact.address}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      contact: { ...settings.contact, address: e.target.value } 
                    })
                  }
                  placeholder="Dhaka, Bangladesh"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.social.facebook}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      social: { ...settings.social, facebook: e.target.value } 
                    })
                  }
                  placeholder="https://facebook.com/tiqbud"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.social.instagram}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      social: { ...settings.social, instagram: e.target.value } 
                    })
                  }
                  placeholder="https://instagram.com/tiqbud"
                />
              </div>
              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={settings.social.youtube}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      social: { ...settings.social, youtube: e.target.value } 
                    })
                  }
                  placeholder="https://youtube.com/@tiqbud"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={settings.social.whatsapp}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      social: { ...settings.social, whatsapp: e.target.value } 
                    })
                  }
                  placeholder="https://wa.me/880XXXXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={settings.social.tiktok}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      social: { ...settings.social, tiktok: e.target.value } 
                    })
                  }
                  placeholder="https://tiktok.com/@tiqbud"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
