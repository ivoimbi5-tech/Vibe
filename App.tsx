
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Settings, Bell, X, Music, CheckCircle2, Moon, Upload, Disc, Play, Pause, Trash2, ArrowLeft, Info, User, Code, Github, Globe, ListMusic, ChevronRight } from 'lucide-react';
import { Alarm, Song, AppState, Playlist } from './types';
import { DEFAULT_SONGS } from './constants';
import AlarmCard from './components/AlarmCard';
import { generateMorningGreeting } from './services/quoteService';

const App: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([
    {
      id: '1',
      time: '07:30',
      label: 'Acordar para o Trabalho',
      enabled: true,
      repeat: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      musicUrl: DEFAULT_SONGS[0].url,
      musicTitle: DEFAULT_SONGS[0].title
    }
  ]);
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'default-1',
      name: 'Favoritas',
      songs: [DEFAULT_SONGS[0], DEFAULT_SONGS[1]]
    }
  ]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [greeting, setGreeting] = useState<string>('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Form State
  const [newTime, setNewTime] = useState('08:00');
  const [newLabel, setNewLabel] = useState('');
  const [selectedMusic, setSelectedMusic] = useState<Song>(DEFAULT_SONGS[0]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>(undefined);

  // Playlist Form State
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const seconds = now.getSeconds();
      
      if (seconds === 0 && appState !== 'ringing') {
        const triggered = alarms.find(a => a.enabled && a.time === currentHHmm);
        if (triggered) {
          triggerAlarm(triggered);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms, appState]);

  const triggerAlarm = async (alarm: Alarm) => {
    setActiveAlarm(alarm);
    setAppState('ringing');
    
    if (alarm.playlistId) {
      const playlist = playlists.find(p => p.id === alarm.playlistId);
      if (playlist && playlist.songs.length > 0) {
        setActivePlaylist(playlist);
        setCurrentSongIndex(0);
        playSong(playlist.songs[0].url, false);
      } else {
        playSong(alarm.musicUrl, true);
      }
    } else {
      playSong(alarm.musicUrl, true);
    }

    const msg = await generateMorningGreeting(alarm.label);
    setGreeting(msg);
  };

  const playSong = (url: string, loop: boolean) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.loop = loop;
      audioRef.current.play().catch(e => console.error("Auto-play blocked", e));
    }
  };

  const handleAudioEnded = () => {
    if (activePlaylist) {
      const nextIndex = (currentSongIndex + 1) % activePlaylist.songs.length;
      setCurrentSongIndex(nextIndex);
      playSong(activePlaylist.songs[nextIndex].url, false);
    } else {
      setPreviewingId(null);
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAppState('dashboard');
    setActiveAlarm(null);
    setActivePlaylist(null);
    setGreeting('');
    setPreviewingId(null);
  };

  const snoozeAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAppState('dashboard');
    setActiveAlarm(null);
    setActivePlaylist(null);
    alert("Soneca ativada (5 min)");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newSong: Song = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""), 
        artist: 'Arquivo Local',
        url: url,
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop'
      };
      setCustomSongs(prev => [newSong, ...prev]);
      if (showModal) setSelectedMusic(newSong);
    }
  };

  const handleAddAlarm = () => {
    const newAlarm: Alarm = {
      id: Math.random().toString(36).substr(2, 9),
      time: newTime,
      label: newLabel || 'Novo Alarme',
      enabled: true,
      repeat: [],
      musicUrl: selectedMusic.url,
      musicTitle: selectedPlaylistId 
        ? (playlists.find(p => p.id === selectedPlaylistId)?.name || 'Playlist')
        : selectedMusic.title,
      playlistId: selectedPlaylistId
    };
    setAlarms([...alarms, newAlarm]);
    setShowModal(false);
    resetForm();
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName || playlistSongs.length === 0) return;
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlaylistName,
      songs: playlistSongs
    };
    setPlaylists([...playlists, newPlaylist]);
    setShowPlaylistModal(false);
    setNewPlaylistName('');
    setPlaylistSongs([]);
  };

  const toggleSongInPlaylist = (song: Song) => {
    if (playlistSongs.find(s => s.id === song.id)) {
      setPlaylistSongs(playlistSongs.filter(s => s.id !== song.id));
    } else {
      setPlaylistSongs([...playlistSongs, song]);
    }
  };

  const resetForm = () => {
    setNewTime('08:00');
    setNewLabel('');
    setSelectedMusic(DEFAULT_SONGS[0]);
    setSelectedPlaylistId(undefined);
  };

  const togglePreview = (song: Song) => {
    if (previewingId === song.id) {
      audioRef.current?.pause();
      setPreviewingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = song.url;
        audioRef.current.play();
        setPreviewingId(song.id);
      }
    }
  };

  const deleteCustomSong = (id: string) => {
    setCustomSongs(customSongs.filter(s => s.id !== id));
    if (previewingId === id) {
      audioRef.current?.pause();
      setPreviewingId(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-slate-950 overflow-hidden px-4 py-8">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-violet-600/20 blur-[100px] rounded-full"></div>

      <audio 
        ref={audioRef} 
        onEnded={handleAudioEnded} 
        hidden 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="audio/*" 
        className="hidden" 
      />

      {/* Navigation Header */}
      <header className="w-full max-w-2xl flex justify-between items-center mb-12 z-10">
        <div className="flex items-center gap-3">
          {appState !== 'dashboard' && (
             <button onClick={() => setAppState('dashboard')} className="p-2 glass rounded-xl text-slate-400 hover:text-white transition-colors">
               <ArrowLeft size={20} />
             </button>
          )}
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {appState === 'music-library' ? 'Biblioteca' : appState === 'playlists' ? 'Playlists' : appState === 'settings' ? 'Configurações' : 'VibeWake'}
            </h1>
            <p className="text-slate-500 text-sm">
              {appState === 'music-library' ? `${customSongs.length + DEFAULT_SONGS.length} trilhas` : appState === 'playlists' ? `${playlists.length} coleções` : appState === 'settings' ? 'Sobre o App' : formatDate(currentTime)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setAppState('playlists')}
            className={`p-3 rounded-2xl glass hover:bg-slate-800 transition-colors ${appState === 'playlists' ? 'text-indigo-400 border-indigo-500/50' : 'text-slate-400'}`}
          >
            <ListMusic size={20} />
          </button>
          <button 
            onClick={() => setAppState('settings')}
            className={`p-3 rounded-2xl glass hover:bg-slate-800 transition-colors ${appState === 'settings' ? 'text-indigo-400 border-indigo-500/50' : 'text-slate-400'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl z-10 flex-1">
        
        {appState === 'dashboard' && (
          <>
            <div className="text-center mb-16 animate-float">
              <div className="relative inline-block">
                <h2 className="text-8xl md:text-9xl font-black tracking-tighter text-slate-100">
                  {formatTime(currentTime)}
                </h2>
                <div className="absolute -top-6 -right-6 px-3 py-1 bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/30">
                  Ao Vivo
                </div>
              </div>
            </div>

            <main className="space-y-4 mb-24">
              <div className="flex justify-between items-center px-2 mb-4">
                <h3 className="text-lg font-bold text-slate-300">Seus Alarmes</h3>
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-2xl font-semibold transition-all transform active:scale-95 shadow-xl shadow-indigo-600/20"
                >
                  <Plus size={18} /> Add Novo
                </button>
              </div>

              {alarms.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl opacity-50 border-dashed border-2 border-slate-700">
                  <Clock size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Nenhum alarme configurado.</p>
                </div>
              ) : (
                alarms.map(alarm => (
                  <AlarmCard 
                    key={alarm.id} 
                    alarm={alarm} 
                    onToggle={(id) => setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))} 
                    onDelete={(id) => setAlarms(alarms.filter(a => a.id !== id))}
                  />
                ))
              )}
            </main>
          </>
        )}

        {appState === 'playlists' && (
          <main className="space-y-8 mb-24 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="glass p-6 rounded-[32px] flex items-center justify-between border-indigo-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                   <ListMusic size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Nova Playlist</h4>
                  <p className="text-xs text-slate-400">Agrupe suas músicas favoritas</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPlaylistModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all"
              >
                Criar Agora
              </button>
            </div>

            <div className="space-y-4">
              {playlists.map(playlist => (
                <div key={playlist.id} className="glass p-6 rounded-[32px] border-slate-800/50 hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <ListMusic size={28} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white">{playlist.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{playlist.songs.length} músicas</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPlaylists(playlists.filter(p => p.id !== playlist.id))}
                      className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {playlist.songs.map(song => (
                      <div key={song.id} className="flex-shrink-0 w-24">
                        {song.cover ? (
                          <img src={song.cover} className="w-24 h-24 rounded-2xl object-cover mb-2" alt={song.title} />
                        ) : (
                          <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-2">
                            <Disc size={32} />
                          </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-300 truncate text-center">{song.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {appState === 'music-library' && (
          <main className="space-y-8 mb-24 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="glass p-6 rounded-[32px] flex items-center justify-between border-indigo-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                   <Upload size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Importar Música</h4>
                  <p className="text-xs text-slate-400">Adicione arquivos do dispositivo</p>
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all"
              >
                Escolher Arquivo
              </button>
            </div>

            <section>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Suas Músicas ({customSongs.length})</h3>
              <div className="space-y-3">
                {customSongs.length === 0 ? (
                  <p className="text-center py-8 text-slate-600 font-medium italic">Nenhuma música importada ainda.</p>
                ) : (
                  customSongs.map(song => (
                    <div key={song.id} className="glass p-4 rounded-3xl flex items-center gap-4 group">
                      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                        <Disc size={32} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-white truncate">{song.title}</h4>
                        <p className="text-xs text-slate-500">Arquivo Local</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => togglePreview(song)}
                          className={`p-3 rounded-full transition-all ${previewingId === song.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                          {previewingId === song.id ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button 
                          onClick={() => deleteCustomSong(song.id)}
                          className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Sons Recomendados</h3>
              <div className="grid grid-cols-1 gap-3">
                {DEFAULT_SONGS.map(song => (
                  <div key={song.id} className="glass p-4 rounded-3xl flex items-center gap-4">
                    <img src={song.cover} className="w-14 h-14 rounded-2xl object-cover" alt={song.title} />
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{song.title}</h4>
                      <p className="text-xs text-slate-500">{song.artist}</p>
                    </div>
                    <button 
                      onClick={() => togglePreview(song)}
                      className={`p-3 rounded-full transition-all ${previewingId === song.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      {previewingId === song.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </main>
        )}

        {appState === 'settings' && (
          <main className="space-y-8 mb-24 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* App Info Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2 ml-2 text-slate-400">
                <Info size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Sobre o VibeWake</h3>
              </div>
              <div className="glass p-8 rounded-[40px] border-indigo-500/20 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <Bell size={40} className="text-white" />
                </div>
                <h4 className="text-2xl font-black text-white mb-2">VibeWake AI</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  O VibeWake reinventa sua rotina matinal unindo inteligência artificial e suas músicas favoritas. 
                  Com saudações personalizadas geradas pelo Google Gemini, cada despertar é único, motivador e pensado para você.
                </p>
                <div className="flex justify-center gap-4 text-xs font-bold">
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full">v1.0.0</span>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">Gemini Powered</span>
                </div>
              </div>
            </section>

            {/* Creator Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2 ml-2 text-slate-400">
                <User size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">O Criador</h3>
              </div>
              <div className="glass p-6 rounded-[32px] border-indigo-500/10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border-2 border-slate-700 overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar Criador" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-white text-lg">Mir Koringa</h4>
                  <p className="text-slate-500 text-xs mb-3">Programador Júniot</p>
                  <div className="flex gap-3">
                    <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
                      <Github size={18} />
                    </button>
                    <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
                      <Globe size={18} />
                    </button>
                    <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
                      <Code size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Technology Stack */}
            <section className="space-y-3">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Desenvolvido com</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className="glass p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Code size={16}/></div>
                   <span className="text-xs font-bold text-slate-300">React 19</span>
                 </div>
                 <div className="glass p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Disc size={16}/></div>
                   <span className="text-xs font-bold text-slate-300">Gemini 3</span>
                 </div>
               </div>
            </section>
          </main>
        )}
      </div>

      {/* Ringing UI Overlay */}
      {appState === 'ringing' && activeAlarm && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-slate-950 animate-pulse"></div>
          <div className="relative z-10 text-center w-full max-w-lg">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-indigo-500 blur-[80px] rounded-full opacity-40 animate-ping"></div>
              <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/50">
                <Bell size={64} className="text-white animate-[bounce_1s_infinite]" />
              </div>
            </div>
            <h1 className="text-7xl font-black text-white mb-2">{activeAlarm.time}</h1>
            <p className="text-2xl font-bold text-indigo-300 mb-8">{activeAlarm.label}</p>
            <div className="glass p-8 rounded-[40px] mb-12 border-indigo-500/30">
              <p className="text-indigo-200 italic text-xl leading-relaxed">
                {greeting || "Gerando saudação matinal..."}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={stopAlarm}
                className="w-full py-6 bg-white text-slate-950 rounded-[30px] text-2xl font-black uppercase tracking-widest shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={32} /> Parar Alarme
              </button>
              <button 
                onClick={snoozeAlarm}
                className="w-full py-5 bg-slate-800 text-slate-300 rounded-[30px] text-lg font-bold transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Moon size={20} /> Soneca (5 min)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alarm Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white">Novo Alarme</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-transparent text-6xl font-black text-indigo-400 focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 ml-1">Lembrete</label>
                <input 
                  type="text" 
                  placeholder="Ex: Treino Matinal"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-bold text-slate-400 ml-1">Música de Despertar</label>
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 px-3 py-1.5 rounded-full transition-colors"
                   >
                     <Upload size={14} /> Arquivo Local
                   </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {/* Playlists Section */}
                  {playlists.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 ml-1">Suas Playlists</p>
                      <div className="space-y-2">
                        {playlists.map((playlist) => (
                          <button
                            key={playlist.id}
                            onClick={() => {
                              setSelectedPlaylistId(playlist.id);
                              setSelectedMusic(playlist.songs[0]); // Use first song as fallback
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedPlaylistId === playlist.id ? 'bg-indigo-600 ring-2 ring-indigo-400 shadow-lg shadow-indigo-600/30' : 'bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50'}`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <ListMusic size={24} />
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold text-white text-sm">{playlist.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{playlist.songs.length} músicas</p>
                            </div>
                            {selectedPlaylistId === playlist.id && <CheckCircle2 size={18} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Songs Section */}
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 ml-1">Músicas Individuais</p>
                  
                  {customSongs.length > 0 && (
                    <div className="mb-2">
                      <div className="space-y-2">
                        {customSongs.map((song) => (
                          <button
                            key={song.id}
                            onClick={() => {
                              setSelectedMusic(song);
                              setSelectedPlaylistId(undefined);
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${selectedMusic.id === song.id && !selectedPlaylistId ? 'bg-indigo-600 ring-1 ring-indigo-400' : 'bg-slate-800/50 hover:bg-slate-700'}`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center text-indigo-300">
                              <Disc size={20} />
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="font-bold text-white text-xs truncate">{song.title}</p>
                              <p className="text-[10px] text-slate-400">Arquivo Local</p>
                            </div>
                            {selectedMusic.id === song.id && <CheckCircle2 size={16} className="ml-auto text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 ml-1">Padrão</p>
                  {DEFAULT_SONGS.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedMusic(song)}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${selectedMusic.id === song.id ? 'bg-indigo-600 ring-1 ring-indigo-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <img src={song.cover} className="w-10 h-10 rounded-lg object-cover" alt={song.title} />
                      <div className="text-left">
                        <p className="font-bold text-white text-xs">{song.title}</p>
                        <p className={`text-[10px] ${selectedMusic.id === song.id ? 'text-indigo-200' : 'text-slate-500'}`}>{song.artist}</p>
                      </div>
                      {selectedMusic.id === song.id && <CheckCircle2 size={16} className="ml-auto text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleAddAlarm}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[30px] font-black text-lg transition-all shadow-xl shadow-indigo-600/30"
              >
                Salvar Alarme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Creation Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white">Nova Playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 ml-1">Nome da Playlist</label>
                <input 
                  type="text" 
                  placeholder="Ex: Relaxar"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 ml-1">Selecionar Músicas ({playlistSongs.length})</label>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {[...customSongs, ...DEFAULT_SONGS].map((song) => (
                    <button
                      key={song.id}
                      onClick={() => toggleSongInPlaylist(song)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${playlistSongs.find(s => s.id === song.id) ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-800/50 hover:bg-slate-700'}`}
                    >
                      {song.cover ? (
                        <img src={song.cover} className="w-10 h-10 rounded-lg object-cover" alt={song.title} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                          <Disc size={20} />
                        </div>
                      )}
                      <div className="text-left flex-1">
                        <p className="font-bold text-white text-xs">{song.title}</p>
                        <p className="text-[10px] text-slate-500">{song.artist}</p>
                      </div>
                      {playlistSongs.find(s => s.id === song.id) && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName || playlistSongs.length === 0}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all transform active:scale-95"
              >
                Criar Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[360px] z-20">
        <div className="glass px-6 py-4 rounded-[32px] flex justify-around items-center shadow-2xl border-white/5">
          <button 
            onClick={() => setAppState('dashboard')}
            className={`transition-all duration-300 p-2 rounded-xl ${appState === 'dashboard' ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Clock size={24} />
          </button>
          <button 
            onClick={() => setAppState('music-library')}
            className={`transition-all duration-300 p-2 rounded-xl ${appState === 'music-library' ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Music size={24} />
          </button>
          <button 
            onClick={() => setAppState('playlists')}
            className={`transition-all duration-300 p-2 rounded-xl ${appState === 'playlists' ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ListMusic size={24} />
          </button>
          <button 
            onClick={() => setAppState('settings')}
            className={`transition-all duration-300 p-2 rounded-xl ${appState === 'settings' ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Settings size={24} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
