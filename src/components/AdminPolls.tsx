import React, { useState, useEffect } from 'react';
import { subscribeToPollResults, subscribeToPollResponses } from '../services/firestore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function AdminPolls() {
  const [results, setResults] = useState<Record<string, number>>({});
  const [responses, setResponses] = useState<any[]>([]);
  const pollId = 'world-cup-2026'; // Currently hardcoded to the active poll

  useEffect(() => {
    const unsubResults = subscribeToPollResults(pollId, (res) => {
      setResults(res);
    });
    
    const unsubResponses = subscribeToPollResponses(pollId, (res) => {
      setResponses(res);
    });
    
    return () => {
      unsubResults();
      unsubResponses();
    };
  }, [pollId]);

  const COLORS = ['#10b981', '#f87171', '#fbbf24', '#3b82f6', '#8b5cf6'];

  const data = Object.entries(results).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const totalVotes = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-pami-text">Resultados de Encuestas</h3>
        <p className="text-sm text-pami-muted">Visualizá los resultados de las encuestas activas.</p>
      </div>

      <div className="bg-white border text-left border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-md font-bold mb-2">Encuesta Actual: "¿Hacemos un prode/fixture en guiAP para el Mundial?"</h4>
        <p className="text-sm text-gray-500 mb-6">Total de votos: <span className="font-bold">{totalVotes}</span></p>

        {totalVotes > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10 italic">
            Aún no hay votos registrados para esta encuesta.
          </div>
        )}
      </div>

      {responses.length > 0 && (
        <div className="bg-white border text-left border-gray-200 rounded-xl p-0 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-md font-bold">Detalle de Votos</h4>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-pami-muted sticky top-0">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Respuesta</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {responses.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-pami-text font-medium">{r.userEmail}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                        r.vote === 'Si' ? 'bg-emerald-100 text-emerald-700' :
                        r.vote === 'No' ? 'bg-red-100 text-red-700' :
                        r.vote === 'Voley' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {r.vote}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
