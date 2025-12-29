import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Check, X, Star, MessageSquare, Edit, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  product_name?: string;
  user_email?: string;
}

const AdminReviews: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  const { data: reviews, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      // Fetch reviews without complex joins first
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        throw reviewsError;
      }

      // Fetch products for names
      const productIds = [...new Set(reviewsData?.map(r => r.product_id) || [])];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      // Fetch profiles for emails
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const productMap = new Map(productsData?.map(p => [p.id, p.name]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.email]) || []);

      return (reviewsData || []).map(r => ({
        ...r,
        product_name: productMap.get(r.product_id) || 'Unknown Product',
        user_email: profileMap.get(r.user_id) || 'Unknown User'
      })) as Review[];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: approved })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success(approved ? 'Review approved' : 'Review rejected');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editFormData }) => {
      const { error } = await supabase
        .from('product_reviews')
        .update({
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review updated');
      setIsEditDialogOpen(false);
      setEditingReview(null);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditFormData({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data: editFormData });
    }
  };

  const pendingReviews = reviews?.filter(r => !r.is_approved) || [];
  const approvedReviews = reviews?.filter(r => r.is_approved) || [];

  const renderStars = (rating: number, interactive = false, onRatingChange?: (r: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          className={`h-4 w-4 ${interactive ? 'cursor-pointer' : ''} ${
            star <= rating ? 'fill-primary text-primary' : 'text-muted'
          }`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Reviews</h1>
        <p className="text-muted-foreground">Approve, edit and manage customer reviews</p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex mt-2">
                {renderStars(editFormData.rating, true, (r) => 
                  setEditFormData({ ...editFormData, rating: r })
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Review title"
              />
            </div>
            <div>
              <Label htmlFor="edit-comment">Comment</Label>
              <Textarea
                id="edit-comment"
                value={editFormData.comment}
                onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                placeholder="Review comment"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <MessageSquare className="h-5 w-5" />
              Pending Approval ({pendingReviews.length})
            </CardTitle>
            <CardDescription>Reviews waiting for moderation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.product_name}</TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {review.title && <p className="font-medium">{review.title}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{review.user_email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate({ id: review.id, approved: true })}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete this review?')) {
                              deleteMutation.mutate(review.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Pending Reviews */}
      {pendingReviews.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending reviews to moderate</p>
          </CardContent>
        </Card>
      )}

      {/* Approved Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Approved Reviews ({approvedReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.product_name}</TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {review.title && <p className="font-medium">{review.title}</p>}
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{review.user_email}</TableCell>
                  <TableCell className="text-sm">{new Date(review.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(review)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => approveMutation.mutate({ id: review.id, approved: false })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Delete this review?')) {
                            deleteMutation.mutate(review.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {approvedReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No approved reviews yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviews;
