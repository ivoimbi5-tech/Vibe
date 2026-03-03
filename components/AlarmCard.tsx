
import React from 'react';
import { Alarm } from '../types';
import { Bell, Music, Trash2 } from 'lucide-react';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, onToggle, onDelete }) => {
  return (
    <div className={`glass p-6 rounded-3xl transition-all duration-300 ${alarm.enabled ? 'ring-2 ring-indigo-500 scale-[1.02]' : 'opacity-60 grayscale-[0.5]'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-4xl font-extrabold tracking-tight">{alarm.time}</h3>
          <p className="text-slate-400 font-medium">{alarm.label || 'Sem nome'}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={alarm.enabled} 
              onChange={() => onToggle(alarm.id)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
          <button 
            onClick={() => onDelete(alarm.id)}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-full">
          <Music size={14} className="text-indigo-400" />
          <span className="truncate max-w-[150px]">{alarm.musicTitle}</span>
        </div>
        <div className="flex gap-1">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${alarm.repeat.length > 0 ? 'bg-indigo-900/40 text-indigo-200' : 'bg-slate-800 text-slate-500'}`}>
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlarmCard;
