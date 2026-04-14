import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Image, Type, MessageSquare, Layout } from 'lucide-react';

interface HeroSettings {
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
}

interface AnnouncementSettings {
  message: string;
  phone: string;
  is_visible: boolean;
}

interface FooterSettings {
  about: string;
  address: string;
  email: string;
  phone: string;
  facebook: string;
  instagram: string;
  youtube: string;
}

const AdminSiteContent: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [hero, setHero] = useState<HeroSettings>({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: ''
  });
  
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    message: '',
    phone: '',
    is_visible: true
  });
  
  const [footer, setFooter] = useState<FooterSettings>({
    about: '',
    address: '',
    email: '',
    phone: '',
    facebook: '',
    instagram: '',
    youtube: ''
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-content-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['hero', 'announcement_bar', 'footer']);
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      
      return settingsMap;
    }
  });

  useEffect(() => {
    if (settings) {
      if (settings.hero) setHero(settings.hero as HeroSettings);
      if (settings.announcement_bar) setAnnouncement(settings.announcement_bar as AnnouncementSettings);
      if (settings.footer) setFooter(settings.footer as FooterSettings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: { key: string; value: any }[]) => {
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
      queryClient.invalidateQueries({ queryKey: ['site-content-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const handleSaveAll = () => {
    saveMutation.mutate([
      { key: 'hero', value: hero },
      { key: 'announcement_bar', value: announcement },
      { key: 'footer', value: footer }
    ]);
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
          <h1 className="text-3xl font-bold">Site Content</h1>
          <p className="text-muted-foreground">Manage hero, announcement bar, and footer</p>
        </div>
        <Button 
          onClick={handleSaveAll}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="announcement" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Announcement Bar
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Hero Section Content
              </CardTitle>
              <CardDescription>Customize the main banner on your homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  placeholder="Premium Tech & Gadgets"
                />
              </div>
              <div>
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Textarea
                  id="hero-subtitle"
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  placeholder="Discover the best PC and mobile accessories..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="hero-image">Hero Image URL</Label>
                <Input
                  id="hero-image"
                  value={hero.image_url}
                  onChange={(e) => setHero({ ...hero, image_url: e.target.value })}
                  placeholder="https://example.com/hero-image.jpg"
                />
                {hero.image_url && (
                  <img 
                    src={hero.image_url} 
                    alt="Hero preview" 
                    className="mt-2 h-32 w-auto rounded object-cover"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero-cta-text">CTA Button Text</Label>
                  <Input
                    id="hero-cta-text"
                    value={hero.cta_text}
                    onChange={(e) => setHero({ ...hero, cta_text: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label htmlFor="hero-cta-link">CTA Button Link</Label>
                  <Input
                    id="hero-cta-link"
                    value={hero.cta_link}
                    onChange={(e) => setHero({ ...hero, cta_link: e.target.value })}
                    placeholder="/all-toys"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Bar</CardTitle>
              <CardDescription>The banner shown at the very top of your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="announcement-visible"
                  checked={announcement.is_visible}
                  onCheckedChange={(checked) => setAnnouncement({ ...announcement, is_visible: checked })}
                />
                <Label htmlFor="announcement-visible">Show announcement bar</Label>
              </div>
              <div>
                <Label htmlFor="announcement-message">Message</Label>
                <Input
                  id="announcement-message"
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="🎉 Free Delivery in Dhaka on orders over ৳5,000!"
                />
              </div>
              <div>
                <Label htmlFor="announcement-phone">Phone Number</Label>
                <Input
                  id="announcement-phone"
                  value={announcement.phone}
                  onChange={(e) => setAnnouncement({ ...announcement, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer Content</CardTitle>
              <CardDescription>Customize your site footer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footer-about">About Text</Label>
                <Textarea
                  id="footer-about"
                  value={footer.about}
                  onChange={(e) => setFooter({ ...footer, about: e.target.value })}
                  placeholder="TiqBud is your one-stop destination..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="footer-address">Address</Label>
                  <Input
                    id="footer-address"
                    value={footer.address}
                    onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                    placeholder="Dhaka, Bangladesh"
                  />
                </div>
                <div>
                  <Label htmlFor="footer-email">Email</Label>
                  <Input
                    id="footer-email"
                    type="email"
                    value={footer.email}
                    onChange={(e) => setFooter({ ...footer, email: e.target.value })}
                    placeholder="info@tiqbud.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="footer-phone">Phone</Label>
                <Input
                  id="footer-phone"
                  value={footer.phone}
                  onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Social Media Links</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="footer-facebook">Facebook</Label>
                    <Input
                      id="footer-facebook"
                      value={footer.facebook}
                      onChange={(e) => setFooter({ ...footer, facebook: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="footer-instagram">Instagram</Label>
                    <Input
                      id="footer-instagram"
                      value={footer.instagram}
                      onChange={(e) => setFooter({ ...footer, instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="footer-youtube">YouTube</Label>
                    <Input
                      id="footer-youtube"
                      value={footer.youtube}
                      onChange={(e) => setFooter({ ...footer, youtube: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSiteContent;
