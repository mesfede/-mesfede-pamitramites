import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export function AttentionCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isRed, setIsRed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      
      const startTime = new Date(now);
      startTime.setHours(7, 0, 0, 0);
      
      const endTime = new Date(now);
      endTime.setHours(14, 0, 0, 0);

      // Si es antes de las 7 am o después de las 14 pm
      if (now.getTime() < startTime.getTime()) {
        setIsActive(false);
        setIsFinished(false);
        setTimeRemaining(null);
        return;
      }

      if (now.getTime() >= endTime.getTime()) {
        setIsActive(false);
        setIsFinished(true);
        setTimeRemaining("Fin de la atención");
        return;
      }

      setIsActive(true);
      setIsFinished(false);

      const diff = endTime.getTime() - now.getTime();
      
      // Check if 1 hour or less is remaining
      setIsRed(diff <= 60 * 60 * 1000);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      setTimeRemaining(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isActive && !isFinished) {
    return null; // O podríamos mostrar la hora actual o "Inicia 07:00 AM"
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-w-[120px] px-3 py-1 rounded border",
      isFinished 
        ? "bg-gray-100/80 text-gray-500 border-gray-200" 
        : isRed 
          ? "bg-red-50 text-red-600 border-red-200" 
          : "bg-sky-50 text-sky-600 border-sky-200"
    )}>
      <div className="flex items-center gap-1.5 font-bold tracking-wider text-sm sm:text-base">
        <Clock size={16} className={cn(
          isFinished ? "text-gray-400" : isRed ? "text-red-500 animate-pulse" : "text-sky-500"
        )} />
        <span>{isFinished ? "FIN DE ATENCIÓN" : timeRemaining}</span>
      </div>
      {!isFinished && (
        <span className={cn(
          "text-[9px] uppercase font-bold tracking-tighter opacity-80",
          isRed ? "text-red-600" : "text-sky-700"
        )}>
          TIEMPO RESTANTE
        </span>
      )}
    </div>
  );
}
