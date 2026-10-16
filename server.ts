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

    const errors: string[] = [];

    // Strategy 1a: Open-Meteo via HTTP (Fastest, avoids SSL overhead / cert validation issues)
    try {
      const response = await fetchWithTimeout('http://api.open-meteo.com/v1/forecast?latitude=-34.9215&longitude=-57.9545&current=temperature_2m,weather_code', 3000);
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
      } else {
        errors.push(`Open-Meteo HTTP response: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      errors.push(`Open-Meteo HTTP failed: ${err.message || err}`);
    }

    // Strategy 1b: Open-Meteo via HTTPS (Backup)
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
      } else {
        errors.push(`Open-Meteo HTTPS response: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      errors.push(`Open-Meteo HTTPS failed: ${err.message || err}`);
    }

    // Strategy 2a: WTTR.in via HTTP (Backup option)
    try {
      const response = await fetchWithTimeout('http://wttr.in/La_Plata?format=j1&lang=es', 3000);
      if (response.ok) {
        const data = await response.json();
        if (data.current_condition && data.current_condition.length > 0) {
          const current = data.current_condition[0];
          return res.json({
            temp: Math.round(parseFloat(current.temp_C)),
            description: current.lang_es?.[0]?.value?.toLowerCase() || 'nublado'
          });
        }
      } else {
        errors.push(`wttr.in HTTP response: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      errors.push(`wttr.in HTTP failed: ${err.message || err}`);
    }

    // Strategy 2b: WTTR.in via HTTPS (Backup option)
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
      } else {
        errors.push(`wttr.in HTTPS response: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      errors.push(`wttr.in HTTPS failed: ${err.message || err}`);
    }

    console.warn("All weather server-side fetch strategies failed:", errors);

    // Fallback if all server fetches fail (Never return error, return reasonable winter/autumn temperature in La Plata)
    return res.json({ 
      temp: 14, 
      description: "algo nublado",
      isFallback: true,
      errors
    });
  });

  // Server-side Google Sheets / CSV proxy that bypasses browser CORS & iframe sandbox restrictions
  app.get('/api/fetch-sheet', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'Falta el parámetro de URL' });
    }

    try {
      const trimmed = decodeURIComponent(rawUrl).trim();
      
      // Determine candidate URLs to fetch
      const candidateUrls: string[] = [];

      const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';

      if (idMatch && idMatch[1]) {
        const sheetId = idMatch[1];
        // Strategy 1: Google Sheets CSV export
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
        // Strategy 2: Google Visualization CSV query (publicly accessible)
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        // Strategy 3: Raw URL
        candidateUrls.push(trimmed);
      } else if (trimmed.includes('docs.google.com/spreadsheets/d/e/')) {
        // Published to web
        if (!trimmed.includes('output=csv')) {
          const base = trimmed.split('?')[0].replace(/\/pubhtml$/, '/pub');
          candidateUrls.push(`${base}?output=csv`);
        }
        candidateUrls.push(trimmed);
      } else {
        candidateUrls.push(trimmed);
      }

      // Añadir alternativas a través de CORS proxies públicos si Google bloquea la IP del servidor de Cloud Run
      const expandedUrls: string[] = [];
      for (const u of candidateUrls) {
        expandedUrls.push(u);
        expandedUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);
        expandedUrls.push(`https://corsproxy.io/?${encodeURIComponent(u)}`);
      }

      let lastError = '';
      for (const targetUrl of expandedUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(targetUrl, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/csv, text/plain, */*'
            }
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            lastError = `HTTP ${response.status} (${response.statusText})`;
            continue;
          }

          const text = await response.text();

          // Check if Google redirected to a login page (sheet is private)
          if (
            text.includes('accounts.google.com/ServiceLogin') ||
            text.includes('accounts.google.com/InteractiveLogin') ||
            (text.includes('<!DOCTYPE html>') && text.includes('Google Drive'))
          ) {
            return res.status(403).json({
              error: 'La hoja de Google Sheets está configurada como privada. En Google Sheets, ve a Compartir y cambia el Acceso general a "Cualquier persona que tenga el vínculo" con rol de Lector, o descarga el archivo como CSV y súbelo en la pestaña de Archivo.'
            });
          }

          // If valid text returned
          if (text && !text.includes('<!DOCTYPE html>')) {
            return res.json({ success: true, csv: text });
          }
        } catch (err: any) {
          lastError = err.message || String(err);
        }
      }

      return res.status(400).json({
        error: `No se pudo obtener la planilla (${lastError || 'enlace no accesible'}). Verifica que el archivo de Google Sheets tenga los permisos de lectura públicos.`
      });
    } catch (err: any) {
      console.error('Error in /api/fetch-sheet:', err);
      return res.status(500).json({ error: `Error del servidor: ${err.message}` });
    }
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
