import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

// ─── Curated Jukebox Songs ────────────────────────────────────────────────────
const SONGS = [
  { id: "_z-1fTlSDF0", title: "Happy Birthday To You",       artist: "Traditional",             tag: "🎉 Celebration" },
  { id: "cBR-wrvpsqs", title: "Happy Birthday (Piano Lounge)",artist: "Lesfm",                   tag: "🎉 Celebration" },
  { id: "3GwjfUFyY6M", title: "Celebration",                 artist: "Kool & The Gang",          tag: "🎉 Celebration" },
  { id: "c-3vPxKdj6o", title: "Just The Way You Are",        artist: "Boyce Avenue Cover",       tag: "🎉 Celebration" },
  { id: "vG-21rHqDX0", title: "A Thousand Years",            artist: "Boyce Avenue Cover",       tag: "🎉 Celebration" },
  { id: "nSDgHBxUbVQ", title: "Photograph",                  artist: "Boyce Avenue Cover",       tag: "🎉 Celebration" },
  { id: "hPguWUeBybA", title: "Dawasak Ewi",                 artist: "Shane Glaze Cover",        tag: "🇱🇰 Sinhala"    },
  { id: "-12I_GsBHiM", title: "Sanasennam Ma",               artist: "Mathaka Cover",            tag: "🇱🇰 Sinhala"    },
  { id: "7MZnWW6aQLs", title: "Sansarini Mage",              artist: "Mathaka Cover",            tag: "🇱🇰 Sinhala"    },
  { id: "aqVkzK09HOQ", title: "Munbe Vaa",                   artist: "Ashwathi Rajendran Cover", tag: "🇮🇳 Tamil"      },
  { id: "G90eRkPEjVo", title: "Vaseegara",                   artist: "Jonita Gandhi Cover",      tag: "🇮🇳 Tamil"      },
  { id: "11rbWfSMev0", title: "Tamil Lofi Chill Mix",        artist: "eternaL Compilation",      tag: "🇮🇳 Tamil"      },
  { id: "2Vv-BfVoq4g", title: "Perfect",                     artist: "Ed Sheeran",               tag: "🎵 Pop Hit"     },
  { id: "RgKAFK5djSk", title: "See You Again",               artist: "Wiz Khalifa",              tag: "🎵 Pop Hit"     },
  { id: "kJQP7kiw5Fk", title: "Despacito",                   artist: "Luis Fonsi",               tag: "🎵 Pop Hit"     },
];

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ─── 1. Music Tab ─────────────────────────────────────────────────────────────
function MusicTab({ dark }) {
  const playerRef = useRef(null);
  const holderRef = useRef(null);
  const timerRef  = useRef(null);

  const [playing,     setPlaying]     = useState(false);
  const [volume,      setVolume]      = useState(50);
  const [selected,    setSelected]    = useState(null);
  const [ready,       setReady]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

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

  const changeVol   = (v) => { setVolume(v); playerRef.current?.setVolume(v); };
  const handleSeek  = (e) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    playerRef.current?.seekTo(t, true);
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <p className={`text-sm font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>Select a curated track</p>

      <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-2">
        {SONGS.map((song, i) => {
          const isThisPlaying = selected === i && playing;
          const isSelected    = selected === i;
          return (
            <button key={i} onClick={() => toggleSong(i)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected
                  ? dark ? "border-indigo-500 bg-indigo-500/20" : "border-indigo-400 bg-indigo-50"
                  : dark ? "border-white/10 bg-white/5 hover:border-white/20" : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}>
              <div className="text-left">
                <div className={`text-sm font-bold ${isSelected ? (dark ? "text-indigo-400" : "text-indigo-700") : (dark ? "text-gray-200" : "text-gray-800")}`}>
                  {song.title}
                </div>
                <div className={`text-xs mt-0.5 flex items-center gap-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  <span>{song.artist}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                    song.tag.includes("Celebration") ? (dark ? "bg-orange-500/20 text-orange-400"  : "bg-orange-100 text-orange-700")
                    : song.tag.includes("Sinhala")   ? (dark ? "bg-emerald-500/20 text-emerald-400": "bg-emerald-100 text-emerald-700")
                    : song.tag.includes("Tamil")     ? (dark ? "bg-blue-500/20 text-blue-400"      : "bg-blue-100 text-blue-700")
                    :                                  (dark ? "bg-white/10 text-gray-300"          : "bg-gray-200 text-gray-600")
                  }`}>{song.tag}</span>
                </div>
              </div>
              <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border transition-colors ${
                isThisPlaying
                  ? dark ? "bg-red-500/20 border-red-500/50 text-red-400"   : "bg-red-50 border-red-300 text-red-600"
                  : dark ? "bg-transparent border-white/20 text-gray-400"   : "bg-white border-gray-300 text-gray-600"
              }`}>
                {isThisPlaying ? "⏸" : "▶"}
              </div>
            </button>
          );
        })}
      </div>

      <div className={`pt-4 border-t mt-4 flex flex-col gap-3 ${dark ? "border-white/10" : "border-gray-100"}`}>
        <p className={`text-xs font-semibold truncate ${dark ? "text-gray-300" : "text-gray-800"}`}>
          {selected !== null ? `${playing ? "🎶 Playing:" : "⏸ Paused:"} ${SONGS[selected].title}` : "No song selected"}
        </p>
        <div className={selected === null ? "opacity-30 pointer-events-none" : ""}>
          <div className="flex justify-between text-[10px] mb-1 font-medium" style={{ color: dark ? "#9ca3af" : "#6b7280" }}>
            <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
          </div>
          <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            style={{ background: dark ? "#374151" : "#e5e7eb" }}/>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-[10px] font-medium w-12 ${dark ? "text-gray-400" : "text-gray-500"}`}>Vol: {volume}%</span>
          <input type="range" min="0" max="100" value={volume} step="1" onChange={(e) => changeVol(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            style={{ background: dark ? "#374151" : "#e5e7eb" }}/>
        </div>
      </div>
      <div ref={holderRef} style={{ display: "none" }} />
    </div>
  );
}

// ─── 2. Burger Builder Tab ────────────────────────────────────────────────────
function BurgerBuilderTab({ dark }) {
  const INGREDIENTS = [
    { id: "top",    emoji: "🥯", name: "Top Bun"    },
    { id: "patty",  emoji: "🥩", name: "Patty"      },
    { id: "cheese", emoji: "🧀", name: "Cheese"     },
    { id: "lettuce",emoji: "🥬", name: "Lettuce"    },
    { id: "tomato", emoji: "🍅", name: "Tomato"     },
    { id: "bottom", emoji: "🍞", name: "Bottom Bun" },
  ];

  const [targetBurger, setTargetBurger] = useState([]);
  const [currentBuild, setCurrentBuild] = useState([]);
  const [score,        setScore]        = useState(0);
  const [status,       setStatus]       = useState("Build the burger to match the order!");

  const generateOrder = () => {
    const fillingsCount    = Math.floor(Math.random() * 3) + 2;
    const availableFillings = INGREDIENTS.filter(i => i.id !== "top" && i.id !== "bottom");
    const randomFillings   = Array.from({ length: fillingsCount }, () =>
      availableFillings[Math.floor(Math.random() * availableFillings.length)]);
    setTargetBurger([INGREDIENTS[0], ...randomFillings, INGREDIENTS[5]].reverse());
    setCurrentBuild([]);
    setStatus("Build the burger to match the order!");
  };

  useEffect(() => { generateOrder(); }, []);

  const addIngredient = (item) => {
    const newBuild = [...currentBuild, item];
    setCurrentBuild(newBuild);
    const isCorrectSoFar = newBuild.every((ing, idx) => ing.id === targetBurger[idx].id);
    if (!isCorrectSoFar) {
      setStatus("Oops! Wrong ingredient. Try again.");
      setTimeout(() => setCurrentBuild([]), 800);
      return;
    }
    if (newBuild.length === targetBurger.length) {
      setScore(s => s + 1);
      setStatus("Perfect! 👨‍🍳 Here comes the next order...");
      setTimeout(generateOrder, 1200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <p className={`text-sm font-medium ${status.includes("Oops") ? "text-red-500" : status.includes("Perfect") ? "text-green-500" : (dark ? "text-gray-300" : "text-gray-600")}`}>
          {status}
        </p>
        <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>Orders: <strong className={dark ? "text-white" : ""}>{score}</strong></span>
      </div>
      <div className={`grid grid-cols-2 gap-6 p-4 rounded-2xl border ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}>
        <div className={`flex flex-col items-center justify-end h-48 border-r ${dark ? "border-white/10" : "border-gray-200"}`}>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Chef's Order</p>
          <div className="flex flex-col-reverse items-center gap-1">
            {targetBurger.map((ing, i) => <span key={i} className="text-3xl filter drop-shadow-sm">{ing.emoji}</span>)}
          </div>
        </div>
        <div className="flex flex-col items-center justify-end h-48">
          <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-2 font-bold">Your Board</p>
          <div className="flex flex-col-reverse items-center gap-1 h-full justify-start">
            {currentBuild.map((ing, i) => <span key={i} className="text-3xl filter drop-shadow-md">{ing.emoji}</span>)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {INGREDIENTS.map((ing) => (
          <button key={ing.id} onClick={() => addIngredient(ing)}
            className={`flex flex-col items-center p-2 rounded-xl border transition-colors shadow-sm active:scale-95 ${
              dark ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-500/50" : "bg-white border-gray-200 hover:bg-orange-50 hover:border-orange-200"
            }`}>
            <span className="text-2xl mb-1">{ing.emoji}</span>
            <span className={`text-[10px] font-medium ${dark ? "text-gray-400" : "text-gray-600"}`}>{ing.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Food Memory Match Tab ─────────────────────────────────────────────────
function MemoryMatchTab({ dark }) {
  const EMOJIS = ["🍔", "🍕", "🌮", "🍣", "🍩", "🍦", "☕", "🍇"];
  const [cards,  setCards]  = useState([]);
  const [flipped,setFlipped]= useState([]);
  const [solved, setSolved] = useState([]);
  const [moves,  setMoves]  = useState(0);

  const initializeGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, id) => ({ id, emoji }));
    setCards(shuffled); setFlipped([]); setSolved([]); setMoves(0);
  };

  useEffect(() => { initializeGame(); }, []);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setSolved([...solved, first, second]); setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <p className={`text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>
          {solved.length === cards.length ? "🎉 You found them all!" : "Find the matching pairs"}
        </p>
        <div className="flex gap-3 text-sm">
          <span className={dark ? "text-gray-400" : "text-gray-500"}>Moves: <strong className={dark ? "text-white" : ""}>{moves}</strong></span>
          <button onClick={initializeGame} className={`${dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"} font-medium`}>Restart</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-[280px] mx-auto">
        {cards.map((card, i) => {
          const isRevealed = flipped.includes(i) || solved.includes(i);
          return (
            <button key={card.id} onClick={() => handleCardClick(i)}
              className={`aspect-square text-3xl flex items-center justify-center rounded-xl transition-all duration-300 transform border ${
                isRevealed
                  ? (dark ? "bg-indigo-500/20 border-indigo-500/40 scale-100 shadow-inner" : "bg-indigo-50 border-indigo-200 scale-100 shadow-inner")
                  : (dark ? "bg-white/5 border-white/10 hover:bg-white/10 scale-95 shadow-sm" : "bg-gray-100 border-gray-200 hover:bg-gray-200 scale-95 shadow-sm")
              }`}>
              <span className={`transition-opacity duration-200 ${isRevealed ? "opacity-100" : "opacity-0"}`}>{card.emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 4. Food Merge (2048) Tab ─────────────────────────────────────────────────
function FoodMergeTab({ dark }) {
  const FOOD_MAP = {
    2:    { e: "🍇", bg: "#eee4da" }, 4:    { e: "🍓", bg: "#ede0c8" },
    8:    { e: "🍒", bg: "#f2b179" }, 16:   { e: "🍎", bg: "#f59563" },
    32:   { e: "🍉", bg: "#f67c5f" }, 64:   { e: "🍍", bg: "#f65e3b" },
    128:  { e: "🌮", bg: "#edcf72" }, 256:  { e: "🌭", bg: "#edcc61" },
    512:  { e: "🍕", bg: "#edc850" }, 1024: { e: "🍔", bg: "#edc53f" },
    2048: { e: "🎂", bg: "#edc22e" },
  };

  const newGrid = () => { const g = Array.from({length:4},()=>Array(4).fill(0)); addTile(g); addTile(g); return g; };
  const addTile = (g) => {
    const e = []; g.forEach((r,i)=>r.forEach((v,j)=>{ if(!v) e.push([i,j]); }));
    if (!e.length) return;
    const [r,c] = e[Math.floor(Math.random()*e.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
  };

  const [grid,  setGrid]  = useState(newGrid);
  const [score, setScore] = useState(0);

  const slide = (row, addScore) => {
    let r = row.filter(x => x);
    for (let i = 0; i < r.length - 1; i++) {
      if (r[i] === r[i+1]) { r[i] *= 2; addScore(r[i]); r.splice(i+1,1); }
    }
    while (r.length < 4) r.push(0);
    return r;
  };

  const move = (dir) => {
    let g = grid.map(r => [...r]), moved = false, added = 0;
    const addS = (v) => { added += v; };
    if (dir === "left")  g = g.map(r => { const n = slide(r, addS); if (JSON.stringify(n)!==JSON.stringify(r)) moved=true; return n; });
    else if (dir === "right") g = g.map(r => { const n = slide([...r].reverse(),addS).reverse(); if (JSON.stringify(n)!==JSON.stringify(r)) moved=true; return n; });
    else if (dir === "up") {
      let t = g[0].map((_,c)=>g.map(r=>r[c])).map(r=>{const n=slide(r,addS);if(JSON.stringify(n)!==JSON.stringify(r))moved=true;return n;});
      g = t[0].map((_,c)=>t.map(r=>r[c]));
    } else if (dir === "down") {
      let t = g[0].map((_,c)=>g.map(r=>r[c])).map(r=>{const n=slide([...r].reverse(),addS).reverse();if(JSON.stringify(n)!==JSON.stringify(r))moved=true;return n;});
      g = t[0].map((_,c)=>t.map(r=>r[c]));
    }
    if (moved) { addTile(g); setGrid(g); setScore(s => s + added); }
  };

  useEffect(() => {
    const h = (e) => {
      const m = {ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
      if (m[e.key]) { e.preventDefault(); move(m[e.key]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [grid]);

  const btnCls = `w-10 h-10 rounded-lg border transition-colors flex items-center justify-center ${
    dark ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-gray-50 border-gray-200 hover:bg-indigo-50 text-gray-900"
  }`;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>Merge same foods to upgrade!</p>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>Score: <strong className={dark ? "text-white" : ""}>{score}</strong></span>
          <button onClick={() => { setGrid(newGrid()); setScore(0); }}
            className={`text-xs px-2 py-1 rounded-lg border ${dark ? "border-white/20 hover:bg-white/10 text-gray-300" : "border-gray-200 hover:bg-gray-50 text-gray-700"}`}>New</button>
        </div>
      </div>
      <div className={`grid grid-cols-4 gap-1.5 p-2 rounded-xl max-w-[240px] mx-auto ${dark ? "bg-[#8a7f76]" : "bg-[#bbada0]"}`}>
        {grid.flat().map((v, i) => (
          <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-3xl font-medium transition-all ${!v && dark ? "opacity-50" : ""}`}
            style={{ background: v ? (FOOD_MAP[v]?.bg || "#3c3a32") : "#cdc1b4" }}>
            {v ? FOOD_MAP[v].e : ""}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 mt-2">
        <button onClick={() => move("up")} className={btnCls}>▲</button>
        <div className="flex gap-1">
          <button onClick={() => move("left")} className={btnCls}>◀</button>
          <button onClick={() => move("down")} className={btnCls}>▼</button>
          <button onClick={() => move("right")} className={btnCls}>▶</button>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Catch the Snack ───────────────────────────────────────────────────────
function CatchSnackTab({ dark }) {
  const [score,        setScore]        = useState(0);
  const [activeIdx,    setActiveIdx]    = useState(null);
  const [playing,      setPlaying]      = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState("🍕");
  const [isBomb,       setIsBomb]       = useState(false);
  const [feedback,     setFeedback]     = useState("");
  const EMOJIS = ["🍔","🍕","🌮","🍣","🍩","🍦","🍇","🍓"];

  const startGame = () => {
    setScore(0); setTimeLeft(30); setPlaying(true); setFeedback("");
    setActiveIdx(Math.floor(Math.random() * 9));
  };

  useEffect(() => {
    let timer, moleTimer;
    if (playing && timeLeft > 0) {
      timer     = setTimeout(() => setTimeLeft(l => l - 1), 1000);
      const speed = Math.max(300, 900 - score * 30);
      moleTimer = setTimeout(() => {
        setActiveIdx(Math.floor(Math.random() * 9));
        const bombChance = Math.random() < 0.25;
        setIsBomb(bombChance);
        setCurrentEmoji(bombChance ? "💣" : EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
        setFeedback("");
      }, speed);
    } else if (timeLeft === 0) {
      setPlaying(false); setActiveIdx(null);
      if (score > 0) setFeedback("Time's up!");
    }
    return () => { clearTimeout(timer); clearTimeout(moleTimer); };
  }, [playing, timeLeft, score]);

  const handleTap = (idx) => {
    if (idx === activeIdx && playing) {
      if (isBomb) { setScore(s => Math.max(0, s - 5)); setFeedback("💥 -5 Points!"); }
      else        { setScore(s => s + 1);              setFeedback("✅ +1");          }
      setActiveIdx(null);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center px-2">
        <p className={`text-sm font-bold ${feedback.includes("💥") ? "text-red-500 animate-pulse" : feedback.includes("✅") ? "text-green-500" : dark ? "text-gray-300" : "text-gray-600"}`}>
          {playing ? (feedback || "Watch out for bombs! 💣") : feedback || "Catch the snacks!"}
        </p>
        <div className="flex gap-4 text-sm">
          <span className={dark ? "text-gray-400" : "text-gray-500"}>Time: <strong className={dark ? "text-white" : ""}>{timeLeft}s</strong></span>
          <span className={dark ? "text-gray-400" : "text-gray-500"}>Score: <strong className={dark ? "text-white" : ""}>{score}</strong></span>
        </div>
      </div>
      <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl max-w-[280px] mx-auto border ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}>
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <button key={i} onClick={() => handleTap(i)} disabled={!playing}
            className={`aspect-square rounded-xl border flex items-center justify-center overflow-hidden transition-colors ${dark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"}`}>
            <span className={`text-4xl transition-transform duration-100 ${activeIdx === i ? "scale-100" : "scale-0"}`}>
              {currentEmoji}
            </span>
          </button>
        ))}
      </div>
      <div className="text-center mt-2">
        <button onClick={startGame}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${dark ? "bg-indigo-500 hover:bg-indigo-400 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
          {score > 0 && !playing ? "Play Again" : "Start Catching"}
        </button>
      </div>
    </div>
  );
}

// ─── 6. Tic Tac Toe — helpers (module-level) ─────────────────────────────────
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(c => c !== null)) return "draw";
  return null;
}

function getWinLine(board) {
  for (const line of WIN_LINES) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

// Medium AI: win > block > center > corner > random
function mediumAI(board) {
  const empty = board.map((v,i) => v === null ? i : -1).filter(i => i !== -1);
  // Try to win
  for (const i of empty) {
    const b = [...board]; b[i] = "O";
    if (checkWinner(b) === "O") return i;
  }
  // Block human
  for (const i of empty) {
    const b = [...board]; b[i] = "X";
    if (checkWinner(b) === "X") return i;
  }
  // Center
  if (board[4] === null) return 4;
  // Corner
  const corners = [0,2,6,8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Random
  return empty[Math.floor(Math.random() * empty.length)];
}

// Hard AI: Minimax (unbeatable)
function minimax(board, isMaximizing) {
  const w = checkWinner(board);
  if (w === "O") return 10;
  if (w === "X") return -10;
  if (board.every(c => c !== null)) return 0;
  if (isMaximizing) {
    let best = -Infinity;
    board.forEach((cell, i) => {
      if (cell === null) {
        board[i] = "O";
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    });
    return best;
  } else {
    let best = Infinity;
    board.forEach((cell, i) => {
      if (cell === null) {
        board[i] = "X";
        best = Math.min(best, minimax(board, true));
        board[i] = null;
      }
    });
    return best;
  }
}

function hardAI(board) {
  let bestScore = -Infinity, bestMove = -1;
  board.forEach((cell, i) => {
    if (cell === null) {
      board[i] = "O";
      const score = minimax(board, false);
      board[i] = null;
      if (score > bestScore) { bestScore = score; bestMove = i; }
    }
  });
  return bestMove;
}

// ─── 6. Tic Tac Toe Tab ───────────────────────────────────────────────────────
function TicTacToeTab({ dark }) {
  // "menu" → mode select  |  "playing" → game active
  const [screen,     setScreen]     = useState("menu");
  const [mode,       setMode]       = useState(null);       // "cpu" | "dual"
  const [difficulty, setDifficulty] = useState("medium");   // "medium" | "hard"
  const [board,      setBoard]      = useState(Array(9).fill(null));
  const [isXTurn,    setIsXTurn]    = useState(true);
  const [winner,     setWinner]     = useState(null);       // "X" | "O" | "draw" | null
  const [winLine,    setWinLine]    = useState(null);
  const [scores,     setScores]     = useState({ X: 0, O: 0, draw: 0 });
  const [aiThinking, setAiThinking] = useState(false);

  // ── Start a new game (keeps scores) ──
  const startGame = (selectedMode, selectedDiff) => {
    setMode(selectedMode);
    setDifficulty(selectedDiff || "medium");
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinner(null);
    setWinLine(null);
    setAiThinking(false);
    setScreen("playing");
  };

  // ── Reset round only ──
  const resetRound = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinner(null);
    setWinLine(null);
    setAiThinking(false);
  };

  // ── Full reset (back to menu, clear scores) ──
  const backToMenu = () => {
    setScreen("Back");
    setScores({ X: 0, O: 0, draw: 0 });
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinLine(null);
  };

  // ── Human tap ──
  const handleCellClick = (idx) => {
    if (board[idx] || winner || aiThinking) return;
    // In CPU mode, only let X (human) move on X's turn
    if (mode === "cpu" && !isXTurn) return;

    const newBoard = [...board];
    newBoard[idx]  = isXTurn ? "X" : "O";
    setBoard(newBoard);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinLine(getWinLine(newBoard));
      setScores(s => ({ ...s, [w]: (s[w] || 0) + 1 }));
      return;
    }
    setIsXTurn(!isXTurn);
  };

  // ── AI move (runs after human places X in CPU mode) ──
  useEffect(() => {
    if (mode !== "cpu" || isXTurn || winner) return;
    setAiThinking(true);
    const timer = setTimeout(() => {
      const b    = [...board];
      const move = difficulty === "hard" ? hardAI(b) : mediumAI(b);
      if (move === -1 || move === undefined) { setAiThinking(false); return; }
      b[move] = "O";
      setBoard(b);
      const w = checkWinner(b);
      if (w) {
        setWinner(w);
        setWinLine(getWinLine(b));
        setScores(s => ({ ...s, [w]: (s[w] || 0) + 1 }));
      } else {
        setIsXTurn(true);
      }
      setAiThinking(false);
    }, 420);
    return () => clearTimeout(timer);
  }, [isXTurn, mode, winner]);

  // ── Cell style ──
  const cellStyle = (idx) => {
    const val     = board[idx];
    const inLine  = winLine?.includes(idx);
    const base    = "aspect-square rounded-2xl border-2 flex items-center justify-center text-4xl font-black transition-all duration-200 select-none";
    if (inLine) return `${base} ${dark ? "border-emerald-400 bg-emerald-500/20 scale-105" : "border-emerald-500 bg-emerald-50 scale-105"}`;
    if (val === "X") return `${base} ${dark ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400" : "border-indigo-300 bg-indigo-50 text-indigo-600"}`;
    if (val === "O") return `${base} ${dark ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-orange-300 bg-orange-50 text-orange-500"}`;
    const clickable = !board[idx] && !winner && !aiThinking && (mode === "dual" || isXTurn);
    return `${base} cursor-pointer ${dark
      ? `border-white/10 bg-white/5 ${clickable ? "hover:bg-white/10 hover:border-indigo-500/40 active:scale-95" : ""}`
      : `border-gray-200 bg-gray-50 ${clickable ? "hover:bg-indigo-50 hover:border-indigo-300 active:scale-95" : ""}`}`;
  };

  // ─── MENU SCREEN ─────────────────────────────────────────────────
  if (screen === "Back") {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="text-center">
          <p className="text-5xl mb-3">❌⭕</p>
          <h2 className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>Tic Tac Toe</h2>
          <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>Choose how you want to play</p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {/* vs CPU card */}
          <div className={`rounded-2xl border p-4 flex flex-col items-center gap-3 ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <span className="text-3xl">🤖</span>
            <p className={`text-sm font-bold text-center ${dark ? "text-white" : "text-gray-800"}`}>vs Computer</p>
            <div className="flex flex-col gap-1.5 w-full">
              <button onClick={() => startGame("cpu", "medium")}
                className="w-full py-1.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all active:scale-95">
                Medium
              </button>
              <button onClick={() => startGame("cpu", "hard")}
                className={`w-full py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${dark ? "border-red-500/50 text-red-400 hover:bg-red-500/10" : "border-red-300 text-red-600 hover:bg-red-50"}`}>
                Hard 💀
              </button>
            </div>
          </div>

          {/* Dual play card */}
          <div className={`rounded-2xl border p-4 flex flex-col items-center gap-3 ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <span className="text-3xl">👥</span>
            <p className={`text-sm font-bold text-center ${dark ? "text-white" : "text-gray-800"}`}>2 Players</p>
            <p className={`text-[10px] text-center ${dark ? "text-gray-500" : "text-gray-400"}`}>Pass & Play at the table</p>
            <button onClick={() => startGame("dual")}
              className="w-full py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all active:scale-95 mt-auto">
              Play Together
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING SCREEN ──────────────────────────────────────────────
  const turnLabel = () => {
    if (winner === "draw") return "It's a Draw! 🤝";
    if (winner)            return `${winner === "X" ? (mode === "cpu" ? "You Win! 🎉" : "Player X Wins! 🎉") : (mode === "cpu" ? "Computer Wins 🤖" : "Player O Wins! 🎉")}`;
    if (aiThinking)        return "Computer is thinking... 🤔";
    if (mode === "dual")   return `Player ${isXTurn ? "X" : "O"}'s Turn`;
    return isXTurn ? "Your Turn (X)" : "Computer's Turn (O)";
  };

  const turnColor = () => {
    if (winner === "draw")    return dark ? "text-gray-300"   : "text-gray-600";
    if (winner === "X")       return dark ? "text-indigo-400" : "text-indigo-600";
    if (winner === "O")       return dark ? "text-orange-400" : "text-orange-500";
    if (aiThinking)           return dark ? "text-gray-400"   : "text-gray-500";
    return isXTurn ? (dark ? "text-indigo-400" : "text-indigo-600") : (dark ? "text-orange-400" : "text-orange-500");
  };

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Header: back + mode label */}
      <div className="flex items-center justify-between w-full">
        <button onClick={backToMenu}
          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all active:scale-95 ${dark ? "border-white/10 text-gray-400 hover:bg-white/5" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
          ← Back
        </button>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${dark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
          {mode === "cpu" ? `vs Computer · ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` : "2 Players · Pass & Play"}
        </span>
      </div>

      {/* Scoreboard */}
      <div className={`flex items-center gap-2 w-full rounded-2xl p-3 border ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        <div className={`flex-1 text-center rounded-xl py-2 ${dark ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-indigo-400" : "text-indigo-500"}`}>{mode === "cpu" ? "You (X)" : "Player X"}</p>
          <p className={`text-2xl font-black ${dark ? "text-indigo-400" : "text-indigo-600"}`}>{scores.X}</p>
        </div>
        <div className="flex flex-col items-center px-2">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"}`}>Draw</p>
          <p className={`text-xl font-black ${dark ? "text-gray-400" : "text-gray-500"}`}>{scores.draw}</p>
        </div>
        <div className={`flex-1 text-center rounded-xl py-2 ${dark ? "bg-orange-500/10" : "bg-orange-50"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-orange-400" : "text-orange-500"}`}>{mode === "cpu" ? "Computer (O)" : "Player O"}</p>
          <p className={`text-2xl font-black ${dark ? "text-orange-400" : "text-orange-500"}`}>{scores.O}</p>
        </div>
      </div>

      {/* Turn indicator */}
      <p className={`text-sm font-bold ${turnColor()}`}>{turnLabel()}</p>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[260px]">
        {board.map((val, idx) => (
          <button key={idx} onClick={() => handleCellClick(idx)} className={cellStyle(idx)}
            disabled={!!board[idx] || !!winner || aiThinking || (mode === "cpu" && !isXTurn)}>
            <span className={`transition-all duration-150 ${val ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
              {val === "X" ? "✕" : val === "O" ? "○" : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        {winner && (
          <button onClick={resetRound}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all active:scale-95 shadow-md shadow-indigo-500/20">
            Play Again
          </button>
        )}
        <button onClick={resetRound}
          className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${dark ? "border-white/10 text-gray-400 hover:bg-white/5" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
          Reset Round
        </button>
      </div>

    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "music",     label: "🎵 Music"          },
  { id: "burger",    label: "🍔 Burger Builder"  },
  { id: "memory",    label: "🧠 Food Match"      },
  { id: "merge",     label: "🍉 Food Merge"      },
  { id: "catch",     label: "🕹️ Catch Snack"    },
  { id: "tictactoe", label: "❌ Tic Tac Toe"     },
];

// ─── Main Hub ─────────────────────────────────────────────────────────────────
export default function EntertainmentHub() {
  const [tab, setTab] = useState("music");
  const navigate      = useNavigate();
  const { theme, toggleTheme } = useAppContext();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen p-4 font-sans transition-colors duration-300 ${isDark ? "bg-[#0d0d0d]" : "bg-gray-100"}`}>
      <div className="max-w-lg mx-auto mt-4">

        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>🎉 AURA Hub</h1>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Have fun while your food is prepared!</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                isDark ? "bg-white/5 hover:bg-white/15 text-yellow-300" : "bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}>
              {isDark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <button onClick={() => navigate("/robot")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
                isDark ? "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}>
              ← Menu
            </button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                tab === t.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : isDark
                    ? "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className={`rounded-3xl border p-6 shadow-sm min-h-[460px] transition-colors duration-300 ${isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-gray-100"}`}>
          <div className={tab === "music"     ? "block h-full" : "hidden"}><MusicTab       dark={isDark} /></div>
          <div className={tab === "burger"    ? "block"        : "hidden"}><BurgerBuilderTab dark={isDark} /></div>
          <div className={tab === "memory"    ? "block"        : "hidden"}><MemoryMatchTab  dark={isDark} /></div>
          <div className={tab === "merge"     ? "block"        : "hidden"}><FoodMergeTab    dark={isDark} /></div>
          <div className={tab === "catch"     ? "block"        : "hidden"}><CatchSnackTab   dark={isDark} /></div>
          <div className={tab === "tictactoe" ? "block"        : "hidden"}><TicTacToeTab    dark={isDark} /></div>
        </div>

      </div>
    </div>
  );
}