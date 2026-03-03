
export interface Alarm {
  id: string;
  time: string; // HH:mm format
  label: string;
  enabled: boolean;
  repeat: string[]; // ['Mon', 'Tue', etc]
  musicUrl: string;
  musicTitle: string;
  playlistId?: string; // Optional playlist reference
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export type AppState = 'dashboard' | 'ringing' | 'settings' | 'music-library' | 'playlists';
