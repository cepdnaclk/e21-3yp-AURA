import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const SONGS = [
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

const formatTime = (s) => {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
};

export default function MusicPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppContext();
  const D = theme === "dark";

  const playerRef = useRef(null);
  const holderRef = useRef(null);
  const timerRef  = useRef(null);

  const [playing,     setPlaying]     = useState(false);
  const [volume,      setVolume]      = useState(50);
  const [selected,    setSelected]    = useState(null);
  const [ready,       setReady]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [tagFilter,   setTagFilter]   = useState("All");

  const tags = ["All", ...new Set(SONGS.map(s => s.tag))];

  const filteredSongs = tagFilter === "All"
    ? SONGS
    : SONGS.filter(s => s.tag === tagFilter);

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

  useEffect(() => {
    if (!ready || !holderRef.current) return;
    playerRef.current = new window.YT.Player(holderRef.current, {
      height: "0", width: "0",
      playerVars: { autoplay: 0, controls: 0 },
      events: {
        onReady: (e) => e.target.setVolume(volume),
        onStateChange: (e) => {
          if (e.data === 1) {
            setPlaying(true);
            setDuration(e.target.getDuration());
            timerRef.current = setInterval(() => setCurrentTime(e.target.getCurrentTime()), 1000);
          } else {
            setPlaying(false);
            clearInterval(timerRef.current);
            if (e.data === 0) setCurrentTime(0);
          }
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${D ? "bg-[#0d0d0d]" : "bg-gray-100"}`}>

      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between px-5 py-3 border-b ${D ? "bg-[#111] border-white/5" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/robot")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${D ? "bg-white/5 border-white/10 text-gray-400 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
            <ArrowLeft size={16}/>
          </button>
          <div>
            <h1 className={`text-base font-bold ${D ? "text-white" : "text-gray-900"}`}>🎵 Music Player</h1>
            <p className={`text-xs ${D ? "text-gray-500" : "text-gray-400"}`}>Enjoy while your food is prepared</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/entertain/games")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 transition-all">
            🎮 Games
          </button>
          <button onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${D ? "bg-white/5 text-yellow-300" : "bg-gray-100 text-gray-600"}`}>
            {D ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
        </div>
      </div>

      {/* Tag filters */}
      <div className={`flex-shrink-0 flex gap-2 px-5 py-3 overflow-x-auto border-b ${D ? "border-white/5" : "border-gray-200"}`}>
        {tags.map(tag => (
          <button key={tag} onClick={() => setTagFilter(tag)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tagFilter === tag
                ? "bg-purple-500 text-white"
                : D ? "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10" : "bg-white text-gray-500 border border-gray-200"
            }`}>
            {tag}
          </button>
        ))}
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {filteredSongs.map((song, i) => {
          const realIdx   = SONGS.indexOf(song);
          const isPlaying = selected === realIdx && playing;
          const isSel     = selected === realIdx;
          return (
            <button key={i} onClick={() => toggleSong(realIdx)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] text-left ${
                isSel
                  ? D ? "border-purple-500 bg-purple-500/15" : "border-purple-400 bg-purple-50"
                  : D ? "border-white/8 bg-white/4 hover:border-white/15" : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
              {/* Play icon */}
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg border transition-colors ${
                isPlaying
                  ? D ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-red-50 border-red-200 text-red-500"
                  : isSel
                    ? D ? "bg-purple-500/20 border-purple-500/40" : "bg-purple-50 border-purple-200"
                    : D ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
              }`}>
                {isPlaying ? "⏸" : "▶"}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSel ? D ? "text-purple-300" : "text-purple-700" : D ? "text-white" : "text-gray-800"}`}>
                  {song.title}
                </p>
                <p className={`text-xs truncate mt-0.5 ${D ? "text-gray-500" : "text-gray-400"}`}>{song.artist}</p>
              </div>
              {/* Tag */}
              <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-1 rounded-lg ${
                song.tag.includes("Celebration") ? D ? "bg-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-600"
                : song.tag.includes("Sinhala")   ? D ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                : song.tag.includes("Tamil")     ? D ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"
                :                                  D ? "bg-white/8 text-gray-400" : "bg-gray-100 text-gray-500"
              }`}>{song.tag}</span>
            </button>
          );
        })}
      </div>

      {/* Player bar */}
      <div className={`flex-shrink-0 border-t px-5 py-4 space-y-3 ${D ? "bg-[#111] border-white/8" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold truncate flex-1 ${D ? "text-gray-300" : "text-gray-700"}`}>
            {selected !== null ? `${playing ? "🎶" : "⏸"} ${SONGS[selected].title}` : "No song selected"}
          </p>
          <span className={`text-xs ml-3 ${D ? "text-gray-500" : "text-gray-400"}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <input type="range" min="0" max={duration || 100} value={currentTime}
          onChange={e => { const t = Number(e.target.value); setCurrentTime(t); playerRef.current?.seekTo(t, true); }}
          disabled={selected === null}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500"
          style={{ background: D ? "#374151" : "#e5e7eb" }}/>
        <div className="flex items-center gap-3">
          <span className={`text-xs w-10 ${D ? "text-gray-500" : "text-gray-400"}`}>Vol</span>
          <input type="range" min="0" max="100" value={volume} step="1"
            onChange={e => { const v = Number(e.target.value); setVolume(v); playerRef.current?.setVolume(v); }}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500"
            style={{ background: D ? "#374151" : "#e5e7eb" }}/>
          <span className={`text-xs w-8 text-right ${D ? "text-gray-400" : "text-gray-500"}`}>{volume}%</span>
        </div>
      </div>

      <div ref={holderRef} style={{ display: "none" }} />
    </div>
  );
}