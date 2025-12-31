import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User, Star, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

interface ProductReview {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  product_name?: string;
  user_email?: string;
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${
        i < rating
          ? 'fill-primary text-primary'
          : 'text-muted-foreground'
      }`}
    />
  ));
};

const BlogContent = () => {
  const [activeTab, setActiveTab] = useState('blog');

  // Fetch published blog posts
  const { data: blogPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['public-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  // Fetch approved product reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['public-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          products:product_id (name)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((r: any) => ({
        ...r,
        product_name: r.products?.name || 'Unknown Product'
      })) as ProductReview[];
    }
  });

  const isLoading = postsLoading || reviewsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-foreground mb-2">Blog & Reviews</h1>
          <p className="text-muted-foreground text-lg">
            Tech guides, product comparisons, and customer reviews
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="blog" className="px-6">Blog Posts</TabsTrigger>
            <TabsTrigger value="reviews" className="px-6">Product Reviews</TabsTrigger>
          </TabsList>

          {/* Blog Posts Tab */}
          <TabsContent value="blog">
            {isLoading ? (
              <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : blogPosts && blogPosts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Featured Post */}
                <Card className="lg:col-span-2 bg-card border-border overflow-hidden group">
                  <div className="relative h-64 lg:h-80 overflow-hidden bg-secondary">
                    {blogPosts[0].image_url ? (
                      <img
                        src={blogPosts[0].image_url}
                        alt={blogPosts[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {blogPosts[0].title}
                    </h2>
                    {blogPosts[0].excerpt && (
                      <p className="text-muted-foreground mb-4">{blogPosts[0].excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(blogPosts[0].published_at || blogPosts[0].created_at).toLocaleDateString('en-BD')}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        Read More <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sidebar Posts */}
                <div className="space-y-4">
                  {blogPosts.slice(1, 4).map((post) => (
                    <Card key={post.id} className="bg-card border-border overflow-hidden group">
                      <div className="flex">
                        <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-secondary">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 flex-1">
                          <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.published_at || post.created_at).toLocaleDateString('en-BD')}
                          </span>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Blog Posts Yet</h3>
                  <p className="text-muted-foreground">Check back soon for tech guides and articles!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">
                            {review.product_name}
                          </Badge>
                          {review.title && (
                            <h3 className="font-semibold text-foreground">{review.title}</h3>
                          )}
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-muted-foreground text-sm mb-4">{review.comment}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{new Date(review.created_at).toLocaleDateString('en-BD')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground">Be the first to review a product!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

const Blog = () => (
  <CartProvider>
    <BlogContent />
  </CartProvider>
);

export default Blog;
