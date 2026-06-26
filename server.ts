import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'dns';

// Ensure Node.js prefers IPv4 over IPv6 when resolving hostnames, 
// which prevents connection hangs/failures in container environments like Cloud Run without IPv6 outbound support.
dns.setDefaultResultOrder('ipv4first');

// Helper for safe server-side fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Server-side Weather Proxy that bypasses browser-level CSP / CORS
  app.get('/api/weather', async (req, res) => {
    // Set strict anti-cache headers so Nginx and browsers never cache fallback or stale values
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Strategy 1: Open-Meteo (Server-to-Server) - Highly reliable, fast, with almost 100% uptime
    try {
      const response = await fetchWithTimeout('https://api.open-meteo.com/v1/forecast?latitude=-34.9215&longitude=-57.9545&current=temperature_2m,weather_code', 3000);
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
      console.warn("Server-side open-meteo fetch failed, trying wttr.in...", err);
    }

    // Strategy 2: WTTR.in (Server-to-Server) - Backup option
    try {
      const response = await fetchWithTimeout('https://wttr.in/La_Plata?format=j1&lang=es', 3000);
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
      console.warn("Server-side wttr.in fetch failed.", err);
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
