import express from 'express';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Server-side Weather Proxy that bypasses browser-level CSP / CORS
  app.get('/api/weather', async (req, res) => {
    // Strategy 1: WTTR.in (Server-to-Server)
    try {
      const response = await fetch('https://wttr.in/La_Plata?format=j1&lang=es');
      if (response.ok) {
        const data = await response.json();
        if (data.current_condition && data.current_condition.length > 0) {
          const current = data.current_condition[0];
          return res.json({
            temp: Math.round(parseFloat(current.temp_C)),
            description: current.lang_es?.[0]?.value?.toLowerCase() || 'nublado'
          });
        }
      }
    } catch (err) {
      console.warn("Server-side wttr.in fetch failed, trying Open-Meteo...", err);
    }

    // Strategy 2: Open-Meteo (Server-to-Server)
    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.9215&longitude=-57.9545&current=temperature_2m,weather_code');
      if (response.ok) {
        const data = await response.json();
        if (data.current) {
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
          return res.json({
            temp: Math.round(data.current.temperature_2m),
            description: mapWeatherCodeToDesc(data.current.weather_code)
          });
        }
      }
    } catch (err) {
      console.warn("Server-side open-meteo fetch failed.", err);
    }

    // Fallback if all server fetches fail (Never return error, return reasonable winter/autumn temperature in La Plata)
    return res.json({ 
      temp: 14, 
      description: "algo nublado",
      isFallback: true
    });
  });

  // Setup Vite dev server or serve static build
  const distPath = path.join(process.cwd(), 'dist');
  const hasBuild = fs.existsSync(path.join(distPath, 'index.html'));

  if (!hasBuild && process.env.NODE_ENV !== 'production') {
    // Dynamic import to prevent crash in production when vite is not installed
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
