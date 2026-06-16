/**
 * ============================================================
 *  AURA Restaurant System — Music Player Context
 * ============================================================
 *  Holds a single persistent YouTube player instance so music
 *  keeps playing across navigation between table-role pages
 *  (RobotUI, EntertainmentHub, MusicPage, GamesPage).
 *
 *  The hidden YT player div is rendered once at the table-role
 *  layout root (outside <Routes>), so it never unmounts on
 *  route change.
 * ============================================================
 */

import { createContext, useContext, useRef, useState, useEffect } from 'react';

export const SONGS = [
  { id: "_z-1fTlSDF0", title: "Happy Birthday To You",        artist: "Traditional",             tag: "🎉 Celebration" },
  { id: "cBR-wrvpsqs", title: "Happy Birthday (Piano Lounge)", artist: "Lesfm",                  tag: "🎉 Celebration" },
  { id: "3GwjfUFyY6M", title: "Celebration",                  artist: "Kool & The Gang",         tag: "🎉 Celebration" },
  { id: "c-3vPxKdj6o", title: "Just The Way You Are",         artist: "Boyce Avenue Cover",      tag: "🎉 Celebration" },
  { id: "vG-21rHqDX0", title: "A Thousand Years",             artist: "Boyce Avenue Cover",      tag: "🎉 Celebration" },
  { id: "nSDgHBxUbVQ", title: "Photograph",                   artist: "Boyce Avenue Cover",      tag: "🎉 Celebration" },
  { id: "hPguWUeBybA", title: "Dawasak Ewi",                  artist: "Shane Glaze Cover",       tag: "🇱🇰 Sinhala"   },
  { id: "-12I_GsBHiM", title: "Sanasennam Ma",                artist: "Mathaka Cover",           tag: "🇱🇰 Sinhala"   },
  { id: "7MZnWW6aQLs", title: "Sansarini Mage",               artist: "Mathaka Cover",           tag: "🇱🇰 Sinhala"   },
  { id: "aqVkzK09HOQ", title: "Munbe Vaa",                    artist: "Ashwathi Rajendran Cover",tag: "🇮🇳 Tamil"     },
  { id: "G90eRkPEjVo", title: "Vaseegara",                    artist: "Jonita Gandhi Cover",     tag: "🇮🇳 Tamil"     },
  { id: "11rbWfSMev0", title: "Tamil Lofi Chill Mix",         artist: "eternaL Compilation",     tag: "🇮🇳 Tamil"     },
  { id: "2Vv-BfVoq4g", title: "Perfect",                      artist: "Ed Sheeran",              tag: "🎵 Pop Hit"    },
  { id: "RgKAFK5djSk", title: "See You Again",                artist: "Wiz Khalifa",             tag: "🎵 Pop Hit"    },
  { id: "kJQP7kiw5Fk", title: "Despacito",                    artist: "Luis Fonsi",              tag: "🎵 Pop Hit"    },
];

const MusicPlayerContext = createContext(null);

export function MusicPlayerProvider({ children }) {
  const playerRef = useRef(null);
  const holderRef = useRef(null);
  const timerRef  = useRef(null);

  const [playing,     setPlaying]     = useState(false);
  const [volume,      setVolume]      = useState(50);
  const [selected,    setSelected]    = useState(null);
  const [ready,       setReady]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) { setReady(true); return; }
    if (!document.getElementById("yt-script")) {
      const s = document.createElement("script");
      s.id  = "yt-script";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    window.onYouTubeIframeAPIReady = () => setReady(true);
  }, []);

  // Create the player once the API is ready and the holder div exists
  useEffect(() => {
    if (!ready || !holderRef.current || playerRef.current) return;
    playerRef.current = new window.YT.Player(holderRef.current, {
      height: "0", width: "0",
      playerVars: { autoplay: 0, controls: 0 },
      events: {
        onReady: (e) => e.target.setVolume(volume),
        onStateChange: (e) => {
          if (e.data === 1) {
            setPlaying(true);
            setDuration(e.target.getDuration());
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => setCurrentTime(e.target.getCurrentTime()), 1000);
          } else {
            setPlaying(false);
            clearInterval(timerRef.current);
            if (e.data === 0) setCurrentTime(0);
          }
        },
        onError: (e) => {
          if (e.data === 101 || e.data === 150) alert("YouTube blocked this song from external apps.");
          else if (e.data === 100) alert("Video not found (deleted or private).");
          else alert("YouTube error. Code: " + e.data);
          setPlaying(false);
        },
      },
    });
    return () => clearInterval(timerRef.current);
  }, [ready]);

  const toggleSong = (index) => {
    if (!playerRef.current) return;
    if (selected === index) {
      playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    } else {
      setSelected(index);
      playerRef.current.loadVideoById(SONGS[index].id);
      setCurrentTime(0);
    }
  };

  const changeVolume = (v) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const seek = (t) => {
    setCurrentTime(t);
    playerRef.current?.seekTo(t, true);
  };

  const value = {
    SONGS,
    playing,
    volume,
    selected,
    currentTime,
    duration,
    toggleSong,
    changeVolume,
    seek,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {/* Hidden YT player target — stays mounted across all table-role pages */}
      <div ref={holderRef} style={{ display: "none" }} />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return ctx;
}