import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login to submit a review');
      
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title: title || null,
          comment: comment || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review submitted! It will appear after approval.');
      setShowForm(false);
      setRating(5);
      setTitle('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const renderStars = (rating: number, interactive = false, onRatingChange?: (r: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        onClick={() => interactive && onRatingChange && onRatingChange(i + 1)}
        className={`w-5 h-5 ${interactive ? 'cursor-pointer' : ''} ${
          i < rating
            ? 'fill-primary text-primary'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-foreground">
                {averageRating.toFixed(1)}
              </div>
              <div>
                <div className="flex">{renderStars(Math.round(averageRating))}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {reviews?.length || 0} reviews
                </p>
              </div>
            </div>
            {user && (
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Write a Review
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showForm && (
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div>
                <Label>Your Rating</Label>
                <div className="flex mt-2">
                  {renderStars(rating, true, setRating)}
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your review"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => submitReviewMutation.mutate()}
                  disabled={submitReviewMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold text-foreground mb-1">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductReviews;
