import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Fetch weather right away and then every 15 mins
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.9215&longitude=-57.9545&current=temperature_2m,weather_code');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (mounted && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code
          });
        }
      } catch (err) {
        console.warn("Weather widget could not be loaded (likely network request blocked):", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getWeatherDetails = (code: number) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    switch (true) {
      case code === 0:
        return { icon: Sun, label: 'Despejado', color: 'text-amber-500' };
      case code >= 1 && code <= 3:
        return { icon: Cloud, label: 'Nuboso', color: 'text-sky-500' };
      case code >= 45 && code <= 48:
        return { icon: CloudFog, label: 'Niebla', color: 'text-slate-400' };
      case code >= 51 && code <= 67:
      case code >= 80 && code <= 82:
        return { icon: CloudRain, label: 'Lluvia', color: 'text-blue-500' };
      case code >= 71 && code <= 77:
      case code >= 85 && code <= 86:
        return { icon: CloudSnow, label: 'Nieve', color: 'text-sky-300' };
      case code >= 95 && code <= 99:
        return { icon: CloudLightning, label: 'Tormenta', color: 'text-violet-500' };
      default:
        return { icon: Cloud, label: 'Variable', color: 'text-sky-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-w-[120px] px-3 py-1 rounded border bg-slate-50 text-slate-400 border-slate-200">
        <Loader2 size={16} className="animate-spin mb-1" />
        <span className="text-[9px] uppercase font-bold tracking-tighter opacity-80">CARGANDO...</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex flex-col items-center justify-center min-w-[120px] px-3 py-1 rounded border bg-slate-50 text-slate-400 border-slate-200">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-sm sm:text-base">
          <Cloud size={16} className="text-slate-400" />
          <span>--°C</span>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-tighter opacity-80 text-slate-500">
          LA PLATA, BA
        </span>
      </div>
    );
  }

  const { icon: Icon, label, color } = getWeatherDetails(weather.code);

  return (
    <div className="flex flex-col items-center justify-center min-w-[120px] px-3 py-1 rounded border bg-slate-50 text-slate-600 border-slate-200">
      <div className="flex items-center gap-1.5 font-bold tracking-wider text-sm sm:text-base">
        <Icon size={16} className={color} />
        <span>{weather.temp}°C</span>
      </div>
      <span className="text-[9px] uppercase font-bold tracking-tighter opacity-80 text-slate-700">
        LA PLATA, BA
      </span>
    </div>
  );
}
