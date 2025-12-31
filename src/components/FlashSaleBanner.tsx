import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_time: string;
  end_time: string;
}

const FlashSaleBanner = () => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const { data: activeSale } = useQuery({
    queryKey: ['active-flash-sale'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('end_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as FlashSale | null;
    },
    refetchInterval: 60000 // Refetch every minute
  });

  useEffect(() => {
    if (!activeSale) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(activeSale.end_time).getTime();
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [activeSale]);

  if (!activeSale || !timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-primary via-[hsl(var(--flash-sale-mid))] to-[hsl(var(--flash-sale-end))] text-primary-foreground py-3 px-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 animate-pulse" />
          <div>
            <span className="font-bold text-lg">{activeSale.name}</span>
            <Badge className="ml-2 bg-background/20 text-primary-foreground border-0">
              Up to {activeSale.discount_percentage}% OFF
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Ends in:</span>
            <div className="flex gap-1">
              <div className="bg-background/20 px-2 py-1 rounded font-mono font-bold">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="font-bold">:</span>
              <div className="bg-background/20 px-2 py-1 rounded font-mono font-bold">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="font-bold">:</span>
              <div className="bg-background/20 px-2 py-1 rounded font-mono font-bold">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          
          <Link 
            to={`/flash-sale/${activeSale.id}`}
            className="bg-background text-primary px-4 py-1.5 rounded-full font-bold text-sm hover:bg-background/90 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleBanner;
