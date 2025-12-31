import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

interface ReturnRequestProps {
  orderId: string;
  orderStatus: string;
  orderTotal: number;
}

const returnReasons = [
  'Wrong item received',
  'Item damaged/defective',
  'Item not as described',
  'Changed my mind',
  'Item arrived late',
  'Quality not satisfactory',
  'Other'
];

const ReturnRequest = ({ orderId, orderStatus, orderTotal }: ReturnRequestProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const queryClient = useQueryClient();

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('returns')
        .insert({
          order_id: orderId,
          user_id: user.id,
          reason: `${reason}${details ? `: ${details}` : ''}`,
          refund_amount: orderTotal,
          status: 'pending'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-returns'] });
      toast.success('Return request submitted successfully');
      setIsOpen(false);
      setReason('');
      setDetails('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit return request');
    }
  });

  // Only show return button for delivered orders
  if (orderStatus !== 'delivered') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Request Return
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Return/Refund</DialogTitle>
          <DialogDescription>
            Please select a reason for your return request. Our team will review it within 1-2 business days.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason">Reason for return *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {returnReasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="details">Additional details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide more details about your return..."
              className="mt-2"
              rows={4}
            />
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Refund Amount:</strong> ৳{orderTotal.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Refunds are processed within 5-7 business days after approval.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => returnMutation.mutate()}
            disabled={!reason || returnMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {returnMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnRequest;
