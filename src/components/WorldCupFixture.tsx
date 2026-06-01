import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Calendar, Radio, ChevronRight, ChevronLeft } from 'lucide-react';

export function WorldCupFixture() {
  const matches = [
    { date: '11/06',  time: '14:00', team1: 'Argentina', team2: 'Por Definir', group: 'A' },
    { date: '16/06',  time: '17:00', team1: 'Argentina', team2: 'Por Definir', group: 'A' },
    { date: '21/06',  time: '15:00', team1: 'Por Definir', team2: 'Argentina', group: 'A' }
  ];

  const liveMatch = {
    team1: 'Francia',
    team1Score: 1,
    team2: 'Brasil',
    team2Score: 1,
    minute: "64'",
    status: 'En Vivo'
  };

  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const dailyMatches = [
    {
      id: 1,
      isFirstOfFecha: true,
      fechaName: "FECHA 1",
      date: "11",
      month: "JUN",
      dayName: "JUE",
      matches: [
        { t1: "MEX", f1: "🇲🇽", s1: "-", t2: "RSA", f2: "🇿🇦", s2: "-", time: "16:00" },
        { t1: "KOR", f1: "🇰🇷", s1: "-", t2: "CZE", f2: "🇨🇿", s2: "-", time: "23:00" }
      ]
    },
    {
      id: 2,
      isFirstOfFecha: false,
      fechaName: "FECHA 1",
      date: "12",
      month: "JUN",
      dayName: "VIE",
      matches: [
        { t1: "CAN", f1: "🇨🇦", s1: "-", t2: "BIH", f2: "🇧🇦", s2: "-", time: "16:00" },
        { t1: "USA", f1: "🇺🇸", s1: "-", t2: "PAR", f2: "🇵🇾", s2: "-", time: "22:00" }
      ]
    },
    {
      id: 3,
      isFirstOfFecha: false,
      fechaName: "FECHA 1",
      date: "13",
      month: "JUN",
      dayName: "SÁB",
      matches: [
        { t1: "QAT", f1: "🇶🇦", s1: "-", t2: "SUI", f2: "🇨🇭", s2: "-", time: "16:00" },
        { t1: "BRA", f1: "🇧🇷", s1: "-", t2: "MAR", f2: "🇲🇦", s2: "-", time: "19:00" }
      ]
    },
    {
      id: 4,
      isFirstOfFecha: false,
      fechaName: "FECHA 1",
      date: "14",
      month: "JUN",
      dayName: "DOM",
      matches: [
        { t1: "HAI", f1: "🇲🇹", s1: "-", t2: "SCO", f2: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", s2: "-", time: "13:00" },
        { t1: "ARG", f1: "🇦🇷", s1: "-", t2: "POR", f2: "🇵🇹", s2: "-", time: "21:00" }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-pami-text flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            Fixture Mundial 2026
          </h2>
          <p className="text-sm text-pami-muted">Seguí todos los partidos y enterate de los resultados.</p>
        </div>
      </div>

      {/* Live Match Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-sm border border-emerald-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold mb-4 uppercase tracking-widest text-xs sm:text-sm">
            <Radio size={16} className="animate-pulse" />
            <span>Resultados En Vivo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>
          
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex-1 text-center font-bold text-lg sm:text-2xl text-gray-800">
              {liveMatch.team1}
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 sm:px-8">
              <div className="flex items-center gap-2 sm:gap-4 text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter">
                <span>{liveMatch.team1Score}</span>
                <span className="text-gray-300">-</span>
                <span>{liveMatch.team2Score}</span>
              </div>
              <span className="text-emerald-600 font-bold mt-2 bg-emerald-100 px-3 py-1 rounded-full text-xs sm:text-sm">
                 {liveMatch.minute}
              </span>
            </div>
            
            <div className="flex-1 text-center font-bold text-lg sm:text-2xl text-gray-800">
              {liveMatch.team2}
            </div>
          </div>
        </div>
      </div>

      {/* DÍA A DÍA DEL MUNDIAL - CAROUSEL WIDGET INSPIRADO EN LA CAPTURA */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="border-b border-[#8abb21]/30 pb-3 mb-4">
          <h3 className="text-xl font-bold text-[#8abb21] tracking-wide">
            Día a día del Mundial
          </h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-[#8abb21] uppercase tracking-wider">Mundial</span>
            <span className="h-4 w-px bg-gray-300" />
            <span className="text-xs text-gray-400">Prontos a comenzar</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="bg-gray-600 text-white text-xs px-3 py-1.5 rounded-full font-bold">
              Mundial 2026
            </span>
            <button 
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors pointer-events-auto"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors pointer-events-auto"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Carrusel Deslizable */}
        <div 
          ref={carouselRef}
          className="flex items-stretch gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 px-1"
        >
          {dailyMatches.map((day, idx) => (
            <React.Fragment key={day.id}>
              {/* Bloque de Día */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Indicador de Fecha Vertical si corresponde */}
                {day.isFirstOfFecha && (
                  <div className="bg-[#8abb21] text-white py-4 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center [writing-mode:vertical-lr] rotate-180 h-full min-h-[110px]">
                    {day.fechaName}
                  </div>
                )}

                {/* Tarjeta de Calendario */}
                <div className="border border-gray-200 rounded-xl overflow-hidden text-center bg-white shadow-sm w-16 h-20 flex flex-col pt-0.5 shrink-0 select-none">
                  <div className="bg-[#8abb21]/10 text-[#8abb21] text-[10px] font-bold py-0.5 uppercase tracking-wider leading-none">
                    {day.month}
                  </div>
                  <div className="text-2xl font-black text-gray-800 leading-tight flex-1 flex items-center justify-center">
                    {day.date}
                  </div>
                  <div className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase py-0.5 border-t border-gray-100 leading-none">
                    {day.dayName}
                  </div>
                </div>

                {/* Listado de Partidos del Día */}
                <div className="flex flex-col gap-3 min-w-[200px] justify-center">
                  {day.matches.map((m, mIdx) => (
                    <div key={mIdx} className="flex flex-col">
                      {/* Horario */}
                      <span className="text-[10px] text-gray-400 font-bold self-start ml-2 mb-0.5">
                        {m.time}
                      </span>
                      {/* Equipos, banderas y marcador */}
                      <div className="flex items-center justify-between gap-3 px-2">
                        {/* Equipo 1 */}
                        <div className="flex items-center gap-1.5 w-18">
                          <span className="text-xs font-black text-gray-700 tracking-wide">{m.t1}</span>
                          <span className="text-lg leading-none">{m.f1}</span>
                        </div>
                        {/* Marcador score 1 */}
                        <div className="text-xs font-bold text-gray-400 flex items-center justify-center w-5 bg-gray-50 rounded border border-gray-100 py-0.5 h-6">
                          {m.s1}
                        </div>
                        
                        {/* Marcador score 2 */}
                        <div className="text-xs font-bold text-gray-400 flex items-center justify-center w-5 bg-gray-50 rounded border border-gray-100 py-0.5 h-6">
                          {m.s2}
                        </div>
                        {/* Equipo 2 */}
                        <div className="flex items-center gap-1.5 w-18 justify-end">
                          <span className="text-lg leading-none">{m.f2}</span>
                          <span className="text-xs font-black text-gray-700 tracking-wide text-right">{m.t2}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Separador vertical entre días excepto el último */}
              {idx < dailyMatches.length - 1 && (
                <div className="w-px bg-gray-200 self-stretch my-2 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Argentina Matches */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left">
        <div className="h-48 relative flex items-center justify-center bg-gray-900">
          <img 
            src="/src/assets/images/argentina_world_cup_1779978822564.png" 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
            alt="Argentina World Cup" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-widest drop-shadow-md">VAMOS ARGENTINA</h3>
            <p className="text-white/80 font-medium tracking-widest mt-2 uppercase text-sm">Próximos Partidos</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid gap-4">
            {matches.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-pami-blue/30 transition-colors gap-4"
              >
                <div className="flex items-center gap-3 text-pami-muted font-mono text-sm shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                  <Calendar size={16} />
                  <span>{m.date}</span>
                  <span className="font-bold text-gray-700 ml-2">{m.time} HS</span>
                </div>
                
                <div className="flex items-center justify-center gap-4 sm:gap-8 flex-1 w-full font-bold text-lg px-4">
                  <div className={`flex-1 text-right truncate ${m.team1 === 'Argentina' ? 'text-pami-blue text-xl' : 'text-gray-600'}`}>
                    {m.team1}
                  </div>
                  <div className="px-3 py-1 bg-white text-gray-400 text-sm rounded-lg border border-gray-200 shadow-sm">
                    VS
                  </div>
                  <div className={`flex-1 text-left truncate ${m.team2 === 'Argentina' ? 'text-pami-blue text-xl' : 'text-gray-600'}`}>
                    {m.team2}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm font-medium items-center">
        <Trophy size={18} className="shrink-0 text-blue-500" />
        <p>Este es un diseño preliminar de prueba (Preview) para visualizar cómo se integrará el fixture una vez definidos los grupos y horarios exactos.</p>
      </div>
    </div>
  );
}
