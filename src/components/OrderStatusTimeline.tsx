import React from 'react';
import { Check, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusTimelineProps {
  status: string;
  createdAt: string;
  className?: string;
}

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStepIndex = (status: string): number => {
  if (status === 'cancelled') return -1;
  const index = ORDER_STEPS.findIndex(step => step.key === status);
  return index >= 0 ? index : 0;
};

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ status, createdAt, className }) => {
  const currentStepIndex = getStepIndex(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className={cn("py-4", className)}>
        <div className="flex items-center gap-3 text-destructive">
          <div className="p-2 rounded-full bg-destructive/20">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-4", className)}>
      <div className="relative">
        {/* Timeline connector line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border" />
        
        {/* Steps */}
        <div className="space-y-6">
          {ORDER_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.key} className="relative flex items-center gap-4">
                {/* Step indicator */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  {isCompleted && index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                
                {/* Step content */}
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium",
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-primary">Current status</p>
                  )}
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(createdAt).toLocaleDateString()} at{' '}
                      {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
