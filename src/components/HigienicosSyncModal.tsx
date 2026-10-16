import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon, 
  HelpCircle,
  Info,
  Trash2
} from 'lucide-react';
import { HigienicoOrden } from '../types';
import { 
  mapRowToHigienico, 
  normalizeGoogleSheetUrl, 
  getGoogleSheetGvizUrl,
  formatDate 
} from '../utils/higienicosUtils';
import { syncHigienicosFromSheet, updateHigienicosConfig, deleteAllHigienicos } from '../services/firestore';

interface HigienicosSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetUrl?: string;
  onSuccess: (result: { added: number; updated: number; total: number }) => void;
}

export const HigienicosSyncModal: React.FC<HigienicosSyncModalProps> = ({
  isOpen,
  onClose,
  currentSheetUrl = '',
  onSuccess
}) => {
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('higienicos_last_sheet_url') || currentSheetUrl || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<Partial<HigienicoOrden>[] | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [clearPreviousRecords, setClearPreviousRecords] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccessMsg, setWipeSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchFromUrl = async (urlToFetch: string) => {
    if (!urlToFetch.trim()) {
      setError('Por favor ingresa el enlace de tu Google Sheet');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewRows(null);

    const cleanUrl = urlToFetch.trim();
    localStorage.setItem('higienicos_last_sheet_url', cleanUrl);

    try {
      const proxyUrl = `/api/fetch-sheet?url=${encodeURIComponent(cleanUrl)}`;
      const proxyResponse = await fetch(proxyUrl);

      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        if (data.csv) {
          parseAndSetPreview(data.csv);
          return;
        } else if (data.error) {
          throw new Error(data.error);
        }
      } else {
        const errorData = await proxyResponse.json().catch(() => null);
        if (errorData?.error) {
          throw new Error(errorData.error);
        }
      }
    } catch (proxyErr: any) {
      console.warn('Proxy fetch attempt warning:', proxyErr);

      if (proxyErr.message && (proxyErr.message.includes('privada') || proxyErr.message.includes('Acceso general'))) {
        setError(proxyErr.message);
        setIsLoading(false);
        return;
      }

      try {
        const gvizUrl = getGoogleSheetGvizUrl(cleanUrl);
        if (gvizUrl) {
          const gvizRes = await fetch(gvizUrl);
          if (gvizRes.ok) {
            const text = await gvizRes.text();
            if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
              parseAndSetPreview(text);
              return;
            }
          }
        }
      } catch (gvizErr) {
        console.warn('Gviz fallback error:', gvizErr);
      }

      try {
        const directCsv = normalizeGoogleSheetUrl(cleanUrl);
        const directRes = await fetch(directCsv);
        if (directRes.ok) {
          const text = await directRes.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
            parseAndSetPreview(text);
            return;
          }
        }
      } catch (directErr) {
        console.warn('Direct fetch error:', directErr);
      }

      setError(
        proxyErr.message ||
        'No se pudo conectar con el enlace de Google Sheets. Asegúrate de que el archivo esté compartido como "Cualquier persona con el enlace puede leer".'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const parseAndSetPreview = (content: string) => {
    if (!content || !content.trim()) {
      setError('El contenido del Google Sheet está vacío.');
      return;
    }

    Papa.parse(content.trim(), {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        const rawRows = results.data as Record<string, any>[];
        if (!rawRows || rawRows.length === 0) {
          setError('La planilla no contiene filas con datos legibles.');
          return;
        }

        const mapped: Partial<HigienicoOrden>[] = [];
        for (const raw of rawRows) {
          const item = mapRowToHigienico(raw);
          if (item) {
            mapped.push(item);
          }
        }

        if (mapped.length === 0) {
          setError('No se detectaron columnas compatibles en la planilla. Asegúrate de incluir encabezados como: Afiliado / Paciente, Beneficio, Insumo, OME, Vencimiento OME.');
          return;
        }

        setPreviewRows(mapped);
      },
      error: (err: any) => {
        setError('Error al analizar la planilla: ' + err.message);
      }
    });
  };

  const handleWipeExisting = async () => {
    setIsWiping(true);
    setError(null);
    setWipeSuccessMsg(null);
    try {
      const res = await deleteAllHigienicos();
      setWipeSuccessMsg(`Se vaciaron ${res.deleted} registros exitosamente.`);
    } catch (err: any) {
      setError('Error al vaciar registros: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsWiping(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!previewRows || previewRows.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      if (clearPreviousRecords) {
        await deleteAllHigienicos();
      }

      if (sheetUrl.trim()) {
        localStorage.setItem('higienicos_last_sheet_url', sheetUrl.trim());
      }
      const result = await syncHigienicosFromSheet(previewRows, sheetUrl);
      await updateHigienicosConfig({ googleSheetUrl: sheetUrl.trim() });
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Error in sync:', err);
      setError(err.message || 'Error al guardar los datos sincronizados en Firestore');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Vincular y Actualizar Google Sheet</h2>
              <p className="text-xs text-slate-500">Conexión directa con la planilla oficial de órdenes OME</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* URL Input section */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Enlace de tu Google Sheet (Planilla oficial)</span>
                <button 
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-teal-700 hover:text-teal-800 text-xs flex items-center gap-1 font-medium hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> ¿Cómo compartir el enlace?
                </button>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleFetchFromUrl(sheetUrl)}
                  disabled={isLoading || !sheetUrl.trim()}
                  className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Consultar Planilla
                </button>
              </div>
            </div>

            {showHelp && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Pasos rápidos para conectar tu Google Sheet:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  <li>Abre tu planilla oficial de Google Sheets.</li>
                  <li>Haz clic en el botón superior derecho <strong>Compartir</strong>.</li>
                  <li>En <em>Acceso general</em>, selecciona <strong>Cualquier persona con el enlace</strong> (rol Lector).</li>
                  <li>Copia el enlace de la barra de direcciones y pégalo aquí arriba.</li>
                </ol>
              </div>
            )}
          </div>

          {wipeSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{wipeSuccessMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-900">No se pudo leer la planilla</p>
                <p className="text-rose-700 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewRows && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    {previewRows.length} {previewRows.length === 1 ? 'orden detectada' : 'órdenes detectadas'} en la planilla
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Las órdenes ya cargadas preservarán su vigencia
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Afiliado</th>
                      <th className="p-2.5">Beneficio</th>
                      <th className="p-2.5">Hogar</th>
                      <th className="p-2.5">CUD</th>
                      <th className="p-2.5">Insumo</th>
                      <th className="p-2.5">N° OME</th>
                      <th className="p-2.5">Vto. OME (Habilitación)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                    {previewRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-medium text-slate-900">{row.afiliadoNombre || 'Sin nombre'}</td>
                        <td className="p-2.5 font-mono text-[11px]">{row.afiliadoBeneficio}</td>
                        <td className="p-2.5">
                          {row.hogarPami ? (
                            <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 text-[10px] font-semibold">
                              Hogar PAMI
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.tieneCud ? (
                            <span className="px-1.5 py-0.5 rounded-sm bg-teal-100 text-teal-700 text-[10px] font-semibold">
                              CUD Sí
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No</span>
                          )}
                        </td>
                        <td className="p-2.5">{row.insumoTipo} {row.insumoTalle ? `(${row.insumoTalle})` : ''}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{row.nroOme || '-'}</td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {row.fechaVencimientoOme || row.fechaVencimiento ? (
                            <span className="font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {formatDate(row.fechaVencimientoOme || row.fechaVencimiento)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Inmediata</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewRows.length > 15 && (
                <p className="text-[11px] text-slate-400 text-right">
                  + {previewRows.length - 15} órdenes adicionales en la lista
                </p>
              )}

              {/* Opción de vaciar registros previos */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={clearPreviousRecords}
                    onChange={(e) => setClearPreviousRecords(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Vaciar registros anteriores antes de actualizar (reinicio completo desde Google Sheet)</span>
                </label>
                <span className="text-[11px] text-slate-400">Opcional</span>
              </div>
            </div>
          )}

          {/* Wipe option */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <button
              type="button"
              onClick={handleWipeExisting}
              disabled={isWiping}
              className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
              title="Vaciar todos los registros guardados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isWiping ? 'Vaciando...' : 'Vaciar base de datos ahora'}
            </button>
            <span className="text-[11px] text-slate-400">Google Sheet Oficial</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmSync}
            disabled={isLoading || !previewRows || previewRows.length === 0}
            className="px-5 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizar ({previewRows ? previewRows.length : 0} órdenes)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
