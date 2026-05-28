import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { hasUserVotedInPoll, submitPollVote } from '../services/firestore';
import { User } from 'firebase/auth';

interface WorldCupPollModalProps {
  user: User | null;
}

const POLL_ID = 'world-cup-2026';

export function WorldCupPollModal({ user }: WorldCupPollModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkVote() {
      if (!user?.email) return;
      const alreadyVoted = await hasUserVotedInPoll(POLL_ID, user.email);
      if (!alreadyVoted) {
        setIsOpen(true);
      }
    }
    
    // Timeout to not show it exactly on mount, giving time for the app to load
    const t = setTimeout(() => {
      checkVote();
    }, 2000);
    return () => clearTimeout(t);
  }, [user]);

  const handleVote = async (answer: string) => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await submitPollVote(POLL_ID, user.email, answer);
      setVoted(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error voting:", error);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="h-56 relative flex items-center justify-center overflow-hidden bg-gray-900">
                <img 
                  src="/src/assets/images/argentina_world_cup_1779978822564.png" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-80" 
                  alt="Argentina World Cup" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="flex items-end justify-center relative z-10 pb-4 w-full h-full">
                  <h2 className="text-3xl font-black tracking-wider text-center text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] px-4 leading-tight">
                    ¡SE VIENE EL MUNDIAL!
                  </h2>
                </div>
              </div>

              <div className="p-6 text-center">
                {!voted ? (
                  <>
                    <p className="text-gray-700 font-medium mb-6 text-lg">
                      Faltan solo 14 días... 
                      <br/>
                      <span className="text-pami-blue font-bold">¿Implementamos un fixture en Guiap! para ir viendo y seguir los resultados?</span>
                    </p>

                    <div className="flex flex-col gap-3">
                      <button 
                        disabled={loading}
                        onClick={() => handleVote('Si')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        ¡Sí, de una! 🏆
                      </button>
                      <button 
                         disabled={loading}
                        onClick={() => handleVote('No')}
                        className="bg-red-400 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        No me interesa 🤐
                      </button>
                      <button 
                         disabled={loading}
                        onClick={() => handleVote('Voley')}
                        className="bg-amber-400 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        Me gusta el Vóley 🏐
                      </button>
                    </div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 flex flex-col items-center justify-center gap-4"
                  >
                    <CheckCircle2 size={64} className="text-emerald-500" />
                    <p className="text-xl font-bold text-gray-800">¡Gracias por votar!</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
