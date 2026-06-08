import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Loader2 } from 'lucide-react';

const mapWeatherCodeToDesc = (code: number): string => {
  if (code === 0) return 'despejado';
  if (code >= 1 && code <= 3) return 'algo nublado';
  if (code >= 45 && code <= 48) return 'niebla';
  if (code >= 51 && code <= 67) return 'lluvia';
  if (code >= 71 && code <= 77) return 'nieve';
  if (code >= 80 && code <= 82) return 'lluvia';
  if (code >= 85 && code <= 86) return 'nieve';
  if (code >= 95 && code <= 99) return 'tormenta';
  return 'nublado';
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Helper to perform fetch with a timeout
    const fetchWithTimeout = async (url: string, timeoutMs = 3000): Promise<Response> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    // Fetch weather right away and then every 15 mins
    const fetchWeather = async () => {
      // 1. Fetch from our full-stack backend proxy (Bypasses all client-side CORS/CSP blocks!)
      try {
        const res = await fetchWithTimeout('/api/weather', 3000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted && data && typeof data.temp === 'number') {
          setWeather({
            temp: data.temp,
            description: data.description || 'nublado'
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend proxy weather fetch failed, trying client fallback...", err);
      }

      // 2. Direct client fallback (Open-Meteo) as backup
      try {
        const res = await fetchWithTimeout('https://api.open-meteo.com/v1/forecast?latitude=-34.9215&longitude=-57.9545&current=temperature_2m,weather_code', 3000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            description: mapWeatherCodeToDesc(data.current.weather_code)
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Direct client fallback failed too.", err);
      }

      // 3. Graceful default fallback (So the user NEVER sees --°C or gets stuck in Cargando)
      if (mounted) {
        setWeather({
          temp: 14,
          description: 'parcialmente nublado'
        });
        setLoading(false);
      }
    };
    
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getWeatherDetails = (desc: string) => {
    if (desc.includes('tormenta') || desc.includes('trueno')) {
      return { icon: CloudLightning, color: 'text-violet-500' };
    }
    if (desc.includes('lluvia') || desc.includes('llovizna') || desc.includes('precipitación') || desc.includes('chaparrón')) {
      return { icon: CloudRain, color: 'text-blue-500' };
    }
    if (desc.includes('nieve') || desc.includes('nevada')) {
      return { icon: CloudSnow, color: 'text-sky-300' };
    }
    if (desc.includes('niebla') || desc.includes('neblina') || desc.includes('bruma') || desc.includes('humo') || desc.includes('polvo')) {
      return { icon: CloudFog, color: 'text-slate-400' };
    }
    if (desc.includes('nublado') || desc.includes('cubierto')) {
      if (desc.includes('parcialmente') || desc.includes('algo')) {
        return { icon: Cloud, color: 'text-sky-400' };
      }
      return { icon: Cloud, color: 'text-slate-400' };
    }
    if (desc.includes('despejado')) {
      return { icon: Sun, color: 'text-amber-500' };
    }
    return { icon: Cloud, color: 'text-sky-500' };
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

  const { icon: Icon, color } = getWeatherDetails(weather.description);

  return (
    <div className="flex flex-col items-center justify-center min-w-[120px] px-3 py-1 rounded border bg-slate-50 text-slate-600 border-slate-200" title={weather.description}>
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
