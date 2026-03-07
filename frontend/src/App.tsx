import React, { useState, useEffect } from "react";

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [profileData, setProfileData] = useState<any>(null);
  
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persona, setPersona] = useState("guest");
  const [errorMsg, setErrorMsg] = useState("");

  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [newPersona, setNewPersona] = useState("");

  // Reflection Engine State
  const [mood, setMood] = useState<string | null>(null);
  const [reflectionInput, setReflectionInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reflectionsHistory, setReflectionsHistory] = useState<any[]>([]);
  
  // UI States
  const [visibleCount, setVisibleCount] = useState(2);
  const [editingRefId, setEditingRefId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (token) {
      fetch("http://127.0.0.1:8000/api/profile/", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Token expired");
        return res.json();
      })
      .then(data => setProfileData(data))
      .catch(() => handleLogout()); 

      fetchReflections();
    }
  }, [token]);

  const fetchReflections = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reflections/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReflectionsHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const url = isLoginView ? "http://127.0.0.1:8000/api/login/" : "http://127.0.0.1:8000/api/signup/";
    const payload = isLoginView 
      ? { username: email, password } 
      : { first_name: firstName, last_name: lastName, email, password, persona };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Authentication failed");

      localStorage.setItem("access_token", data.access);
      setToken(data.access);
      
      if (!isLoginView && data.user) {
        setProfileData({ ...profileData, first_name: firstName, name: data.user.name, persona: data.user.persona, username: data.user.email });
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdatePersona = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/profile/", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ persona: newPersona }),
      });
      setProfileData({ ...profileData, persona: newPersona });
      setIsEditingPersona(false);
    } catch (err) {
      setProfileData({ ...profileData, persona: newPersona });
      setIsEditingPersona(false);
    }
  };

  const submitReflection = async () => {
    if (!reflectionInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reflections/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: reflectionInput, mood: mood }),
      });
      if (res.ok) {
        const newReflection = await res.json();
        setReflectionsHistory([newReflection, ...reflectionsHistory]);
        setReflectionInput("");
        setMood(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteReflection = async (id: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/reflections/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setReflectionsHistory(reflectionsHistory.filter(ref => ref.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reflections/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        const updatedRef = await res.json();
        setReflectionsHistory(reflectionsHistory.map(ref => ref.id === id ? updatedRef : ref));
        setEditingRefId(null);
      }
    } catch (err) {
      console.error("Failed to update", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setProfileData(null);
    setReflectionsHistory([]);
    setEmail("");
    setPassword("");
  };

  const getDisplayName = () => {
    if (!profileData) return "";
    return profileData.first_name || profileData.name || profileData.username?.split('@')[0] || "Traveler";
  };

  // Expanded Mood Definitions
  const moodOptions = [
    { id: 'calm', icon: '😌', label: 'Calm', themeDark: 'hover:bg-emerald-500/20 text-emerald-400', themeLight: 'hover:bg-emerald-500/10 text-emerald-600' },
    { id: 'joyful', icon: '✨', label: 'Joyful', themeDark: 'hover:bg-yellow-500/20 text-yellow-400', themeLight: 'hover:bg-yellow-500/10 text-yellow-600' },
    { id: 'thinking', icon: '🤔', label: 'Thinking', themeDark: 'hover:bg-purple-500/20 text-purple-400', themeLight: 'hover:bg-purple-500/10 text-purple-600' },
    { id: 'motivated', icon: '🔥', label: 'Motivated', themeDark: 'hover:bg-cyan-500/20 text-cyan-400', themeLight: 'hover:bg-cyan-500/10 text-cyan-600' },
    { id: 'anxious', icon: '😰', label: 'Anxious', themeDark: 'hover:bg-orange-500/20 text-orange-400', themeLight: 'hover:bg-orange-500/10 text-orange-600' },
    { id: 'low', icon: '😞', label: 'Low', themeDark: 'hover:bg-blue-500/20 text-blue-400', themeLight: 'hover:bg-blue-500/10 text-blue-600' },
    { id: 'grateful', icon: '🙏', label: 'Grateful', themeDark: 'hover:bg-pink-500/20 text-pink-400', themeLight: 'hover:bg-pink-500/10 text-pink-600' },
    { id: 'exhausted', icon: '😴', label: 'Exhausted', themeDark: 'hover:bg-slate-500/20 text-slate-400', themeLight: 'hover:bg-slate-500/10 text-slate-600' },
  ];

  const getMoodIcon = (moodId: string) => moodOptions.find(m => m.id === moodId)?.icon || '✨';

  // --- Insight Parser (Separates Tags from Text) ---
  const parseInsight = (text: string) => {
    if (!text) return { content: "", tags: [] };
    const tagRegex = /(#[a-zA-Z0-9_-]+)/g;
    const tags = text.match(tagRegex) || [];
    const content = text.replace(tagRegex, '').trim();
    return { content, tags };
  };

  // --- LifeGrid / Streak Calculator ---
  const calculateStreak = () => {
    if (reflectionsHistory.length === 0) return 0;
    
    const activityMap = new Set(reflectionsHistory.map(ref => {
      const d = new Date(ref.created_at);
      d.setHours(0,0,0,0);
      return d.getTime();
    }));

    const today = new Date();
    today.setHours(0,0,0,0);
    
    let streak = 0;
    let checkDate = new Date(today);

    // If no post today, check if there was one yesterday to keep streak alive
    if (!activityMap.has(checkDate.getTime())) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!activityMap.has(checkDate.getTime())) return 0;
    }

    while(activityMap.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const getLifeGrid = () => {
    const days = Array.from({ length: 28 }).reverse();
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Create a map to track not just IF they posted, but HOW MANY times and WHEN
    const activityMap = new Map();
    reflectionsHistory.forEach(ref => {
      const refDate = new Date(ref.created_at);
      const dayKey = new Date(refDate);
      dayKey.setHours(0,0,0,0);
      
      if (!activityMap.has(dayKey.getTime())) {
        activityMap.set(dayKey.getTime(), { count: 0, times: [] });
      }
      const dayData = activityMap.get(dayKey.getTime());
      dayData.count += 1;
      dayData.times.push(refDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    });

    return days.map((dayOffset, i) => {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - (dayOffset as number));
      const dayData = activityMap.get(targetDate.getTime());
      
      const isActive = !!dayData;
      const count = isActive ? dayData.count : 0;
      
      // Dynamic Tooltip Generation
      let tooltip = `${targetDate.toLocaleDateString()}: No Entry`;
      if (isActive) {
        tooltip = `${targetDate.toLocaleDateString()}: ${count} Reflection${count > 1 ? 's' : ''}\nTime: ${dayData.times.join(', ')}`;
      }

      // Heatmap Color Logic
      let activeColorClass = '';
      if (theme === 'dark') {
        if (count === 1) activeColorClass = 'bg-[#5EEAD4]/60 shadow-[0_0_8px_rgba(94,234,212,0.4)]';
        else if (count >= 2) activeColorClass = 'bg-[#5EEAD4] shadow-[0_0_12px_rgba(94,234,212,0.8)] scale-110';
      } else {
        if (count === 1) activeColorClass = 'bg-[#6366F1]/60 shadow-[0_0_8px_rgba(99,102,241,0.4)]';
        else if (count >= 2) activeColorClass = 'bg-[#6366F1] shadow-[0_0_12px_rgba(99,102,241,0.8)] scale-110';
      }
      
      return (
        <div 
          key={i} 
          title={tooltip}
          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all duration-300 hover:scale-125 cursor-help ${
            isActive 
              ? activeColorClass
              : (theme === 'dark' ? 'bg-[#2A3040] opacity-50 hover:opacity-80' : 'bg-[#E3E6EF] hover:bg-[#D1D5DB]')
          }`}
        />
      );
    });
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-700 font-['Inter',sans-serif] selection:bg-[#5EEAD4] selection:text-[#0F1117] ${
      theme === 'dark' ? 'bg-[#0F1117] text-[#E6EAF2]' : 'bg-[#F7F8FB] text-[#1F2937] selection:bg-[#6366F1] selection:text-white'
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&family=Source+Serif+4:ital,wght@0,300;0,400;1,300;1,400&display=swap');
      `}</style>

      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none blur-[120px] transition-all duration-1000 z-0 fixed"
           style={{ background: theme === 'dark' ? 'radial-gradient(circle, #5EEAD4 0%, transparent 70%)' : 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} />

      {/* Theme Toggle Button */}
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={`fixed top-6 right-6 sm:top-8 sm:right-8 p-3 rounded-full backdrop-blur-md transition-all duration-500 hover:scale-110 active:scale-95 z-50 ${
          theme === 'dark' ? 'bg-[#1D2230]/80 text-[#5EEAD4] hover:bg-[#2A3040] shadow-[0_0_15px_rgba(94,234,212,0.1)]' : 'bg-white/80 text-[#6366F1] hover:bg-[#F1F3F9] shadow-[0_4px_15px_rgba(0,0,0,0.05)]'
        }`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        
        {/* --- RENDER DASHBOARD IF LOGGED IN --- */}
        {token ? (
          <div className="w-full max-w-3xl animate-fade-in-up pb-20 mt-12 sm:mt-0">
            <header className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-light tracking-widest mb-2">
                VISCORA <span className={`font-normal ${theme === 'dark' ? 'text-[#5EEAD4]' : 'text-[#6366F1]'}`}>NEXUS</span>
              </h1>
            </header>
            
            {profileData ? (
              <>
                <div className={`p-6 sm:p-10 rounded-3xl transition-all duration-500 mb-10 relative z-20 ${
                  theme === 'dark' ? 'bg-[#161A23] border border-[#2A3040] shadow-[0_8px_30px_rgba(0,0,0,0.45)]' : 'bg-white border border-[#E3E6EF] shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
                }`}>
                  
                  {/* Greeting & Logout */}
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-light mb-2">
                        Welcome back, <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-[#5EEAD4] dark:to-[#A78BFA]">{getDisplayName()}</span>.
                      </h2>
                    </div>
                    <button onClick={handleLogout} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-[#6B7280] hover:bg-[#1D2230] hover:text-white' : 'text-[#9CA3AF] hover:bg-[#F1F3F9] hover:text-[#1F2937]'}`} title="Disconnect">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                  </div>

                  {/* Status, Persona & LifeGrid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    
                    {/* Persona Widget */}
                    <div className={`p-5 rounded-2xl transition-colors duration-300 flex flex-col justify-between ${theme === 'dark' ? 'bg-[#0F1117] border border-[#1D2230]' : 'bg-[#F7F8FB] border border-[#F1F3F9]'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs uppercase tracking-widest font-medium ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#9CA3AF]'}`}>Active Persona</span>
                        {!isEditingPersona && (
                          <button onClick={() => { setIsEditingPersona(true); setNewPersona(profileData.persona); }} className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-[#2A3040] hover:bg-[#5EEAD4] hover:text-[#0F1117]' : 'bg-[#E3E6EF] hover:bg-[#6366F1] hover:text-white'}`}>Configure</button>
                        )}
                      </div>
                      {isEditingPersona ? (
                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                          <select value={newPersona} onChange={(e) => setNewPersona(e.target.value)} className={`flex-1 p-2 rounded-xl text-sm border focus:outline-none transition-all duration-300 ${theme === 'dark' ? 'bg-[#161A23] border-[#2A3040] text-white focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]' : 'bg-white border-[#E3E6EF] text-[#1F2937] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]'}`}>
                            <option value="guest">Guest</option>
                            <option value="student">Student</option>
                            <option value="homemaker">Homemaker</option>
                            <option value="professional">Professional</option>
                          </select>
                          <div className="flex gap-2">
                            <button onClick={handleUpdatePersona} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors">✓</button>
                            <button onClick={() => setIsEditingPersona(false)} className="flex-1 sm:flex-none px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-colors">✕</button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-light capitalize tracking-wide mt-2 block">{profileData.persona}</span>
                      )}
                    </div>

                    {/* Activity Streak / LifeGrid Widget */}
                    <div className={`p-5 rounded-2xl transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F1117] border border-[#1D2230]' : 'bg-[#F7F8FB] border border-[#F1F3F9]'}`}>
                       <div className="flex justify-between items-center mb-3">
                         <span className={`block text-xs uppercase tracking-widest font-medium ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#9CA3AF]'}`}>Consistency Streak</span>
                         {calculateStreak() > 0 && (
                           <span className={`text-xs font-medium px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
                             🔥 {calculateStreak()} Day{calculateStreak() !== 1 && 's'}
                           </span>
                         )}
                       </div>
                       <div className="flex flex-wrap gap-1 mt-2">
                         {getLifeGrid()}
                       </div>
                       <p className={`text-[10px] uppercase tracking-widest mt-3 text-right ${theme === 'dark' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>Past 28 Days</p>
                    </div>
                  </div>

                  {/* Mood Grid (Expanded) */}
                  <div className={`p-5 mb-8 rounded-2xl transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F1117] border border-[#1D2230]' : 'bg-[#F7F8FB] border border-[#F1F3F9]'}`}>
                      <span className={`block text-xs uppercase tracking-widest font-medium mb-4 ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#9CA3AF]'}`}>State of Mind</span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {moodOptions.map(m => (
                          <div key={m.id} className="relative flex justify-center group">
                            <button 
                              onClick={() => setMood(m.id)}
                              className={`flex justify-center items-center w-12 h-12 rounded-xl transition-all duration-300 border bg-transparent ${
                                mood === m.id 
                                  ? (theme === 'dark' ? 'bg-[#5EEAD4]/10 border-[#5EEAD4] opacity-100 scale-105' : 'bg-[#6366F1]/10 border-[#6366F1] opacity-100 scale-105') 
                                  : (theme === 'dark' ? `border-transparent opacity-50 hover:opacity-100 ${m.themeDark}` : `border-transparent opacity-60 hover:opacity-100 ${m.themeLight}`)
                              }`}
                            >
                              <span className="text-2xl filter drop-shadow-sm">{m.icon}</span>
                            </button>
                            {/* Hover Tooltip */}
                            <span className={`absolute -top-8 px-2 py-1 text-[10px] uppercase tracking-wider rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 ${
                              theme === 'dark' ? 'bg-[#2A3040] text-white shadow-lg' : 'bg-gray-800 text-white shadow-md'
                            }`}>
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                  </div>

                  {/* Reflection Journal Input Area */}
                  <div className="relative z-30">
                    <textarea 
                      value={reflectionInput}
                      onChange={(e) => setReflectionInput(e.target.value)}
                      placeholder="What is on your mind today? Type your reflection here..."
                      disabled={isAnalyzing}
                      className={`w-full min-h-[160px] p-6 rounded-2xl resize-y transition-all duration-500 outline-none font-['Source_Serif_4'] text-lg ${
                        theme === 'dark' 
                          ? 'bg-[#0F1117] border border-[#2A3040] text-[#E6EAF2] placeholder-[#4B5563] focus:border-[#5EEAD4]/50 focus:shadow-[0_0_20px_rgba(94,234,212,0.05)]' 
                          : 'bg-[#F7F8FB] border border-[#E3E6EF] text-[#1F2937] placeholder-[#9CA3AF] focus:border-[#6366F1]/50 focus:shadow-[0_4px_20px_rgba(99,102,241,0.05)]'
                      }`}
                    />
                    
                    {/* Submit Button */}
                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={submitReflection}
                        disabled={isAnalyzing || !reflectionInput.trim()}
                        className={`px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-500 flex items-center gap-2 ${
                          isAnalyzing ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95 cursor-pointer'
                        } ${
                          theme === 'dark' 
                            ? 'bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] text-[#0F1117] hover:shadow-[0_0_20px_rgba(94,234,212,0.3)]' 
                            : 'bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:shadow-[0_8px_20px_rgba(99,102,241,0.3)]'
                        } disabled:grayscale disabled:hover:scale-100 disabled:shadow-none`}
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-[#0F1117] dark:border-white border-t-transparent animate-spin"></div>
                            Analyzing Nexus...
                          </>
                        ) : 'Process Reflection'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* --- REFLECTION HISTORY TIMELINE --- */}
                {reflectionsHistory.length > 0 && (
                  <div className="w-full mt-12 animate-fade-in-up relative z-20">
                    <h3 className={`text-sm uppercase tracking-widest font-medium mb-6 px-2 ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#9CA3AF]'}`}>Nexus Memory Log</h3>
                    
                    <div className="flex flex-col gap-6">
                      {reflectionsHistory.slice(0, visibleCount).map((ref) => {
                        const insightData = parseInsight(ref.ai_insight);
                        const refDate = new Date(ref.created_at);
                        const today = new Date();
                        const isToday = refDate.toDateString() === today.toDateString();
                        
                        return (
                        <div key={ref.id} className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 relative group ${
                          theme === 'dark' ? 'bg-[#161A23] border border-[#2A3040] hover:border-[#5EEAD4]/30' : 'bg-white border border-[#E3E6EF] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#6366F1]/30'
                        }`}>
                          
                          {/* Actions (Edit / Delete) - Only visible if created today */}
                          {isToday && (
                            <div className={`absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme === 'dark' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                              {editingRefId !== ref.id && (
                                <button onClick={() => { setEditingRefId(ref.id); setEditContent(ref.content); }} className="p-2 hover:text-[#5EEAD4] transition-colors" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                              )}
                              <button onClick={() => handleDeleteReflection(ref.id)} className="p-2 hover:text-rose-500 transition-colors" title="Delete">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-4 opacity-80">
                            {ref.mood && <span className="text-xl">{getMoodIcon(ref.mood)}</span>}
                            <span className={`text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                              {refDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          
                          {/* User's Original Input OR Edit Mode */}
                          {editingRefId === ref.id ? (
                            <div className="mb-6">
                              <textarea 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className={`w-full min-h-[100px] p-4 rounded-xl resize-y outline-none font-['Source_Serif_4'] text-lg ${
                                  theme === 'dark' ? 'bg-[#0F1117] border border-[#5EEAD4]/50 text-[#E6EAF2]' : 'bg-[#F7F8FB] border border-[#6366F1]/50 text-[#1F2937]'
                                }`}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setEditingRefId(null)} className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'hover:bg-[#2A3040]' : 'hover:bg-[#E3E6EF]'}`}>Cancel</button>
                                <button onClick={() => handleSaveEdit(ref.id)} className={`px-3 py-1.5 rounded-lg text-sm text-[#0F1117] ${theme === 'dark' ? 'bg-[#5EEAD4]' : 'bg-[#6366F1] text-white'}`}>Save Updates</button>
                              </div>
                            </div>
                          ) : (
                            <p className="font-['Source_Serif_4'] text-lg leading-relaxed mb-6 whitespace-pre-wrap pr-10">
                              {ref.content}
                            </p>
                          )}

                          {/* AI Insight (With Infographic Tags) */}
                          {ref.ai_insight && (
                            <div className={`p-5 rounded-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-[#0F1117]/80' : 'bg-[#F7F8FB]'}`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${theme === 'dark' ? 'bg-[#5EEAD4]' : 'bg-[#6366F1]'}`}></div>
                              
                              <span className={`block text-[10px] uppercase tracking-widest font-medium mb-3 ${theme === 'dark' ? 'text-[#5EEAD4]' : 'text-[#6366F1]'}`}>
                                Nexus Insight
                              </span>
                              
                              {/* The concise AI text */}
                              <p className={`text-sm leading-relaxed mb-4 ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#4B5563]'}`}>
                                {insightData.content}
                              </p>

                              {/* Extracted Infographic Tags */}
                              {insightData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {insightData.tags.map((tag, idx) => (
                                    <span key={idx} className={`text-xs px-3 py-1 rounded-full font-medium tracking-wide border ${
                                      theme === 'dark' ? 'bg-[#5EEAD4]/10 text-[#5EEAD4] border-[#5EEAD4]/20' : 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20'
                                    }`}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )})}
                    </div>

                    {/* Pagination / Load More */}
                    {visibleCount < reflectionsHistory.length && (
                      <div className="mt-8 text-center">
                        <button 
                          onClick={() => setVisibleCount(v => v + 2)}
                          className={`px-6 py-3 rounded-full text-sm font-medium tracking-wider transition-all duration-300 border ${
                            theme === 'dark' ? 'border-[#2A3040] text-[#A4A9B6] hover:bg-[#1D2230] hover:text-[#5EEAD4] hover:border-[#5EEAD4]' : 'border-[#E3E6EF] text-[#6B7280] hover:bg-[#F1F3F9] hover:text-[#6366F1] hover:border-[#6366F1]'
                          }`}
                        >
                          Unlock Deeper Memory
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className={`w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mb-4 ${theme === 'dark' ? 'border-[#5EEAD4]' : 'border-[#6366F1]'}`}></div>
                <p className="font-light tracking-widest text-sm uppercase">Loading Nexus</p>
              </div>
            )}
          </div>

        ) : (
          /* --- RENDER AUTH FORMS IF LOGGED OUT --- */
          <div className="w-full max-w-md animate-fade-in-up relative z-20">
             <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-light tracking-widest mb-4 drop-shadow-sm">
                  VISCORA <span className={`font-normal ${theme === 'dark' ? 'text-[#5EEAD4]' : 'text-[#6366F1]'}`}>NEXUS</span>
                </h1>
                <p className={`font-light tracking-wide ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#6B7280]'}`}>
                  {theme === 'dark' ? 'Deep night sky, quiet thinking.' : 'Sunlight, calm thinking, elegant.'}
                </p>
             </div>
            
            <div className={`p-8 sm:p-10 rounded-3xl transition-all duration-500 ${
              theme === 'dark' ? 'bg-[#161A23] border border-[#2A3040] shadow-[0_8px_30px_rgba(0,0,0,0.45)]' : 'bg-white border border-[#E3E6EF] shadow-[0_10px_40px_rgba(0,0,0,0.06)]'
            }`}>
              <h2 className="text-2xl font-light mb-8 text-center tracking-wide">{isLoginView ? "Welcome Back" : "Begin Your Journey"}</h2>
              
              {errorMsg && (
                <div className={`p-4 mb-8 rounded-xl text-sm animate-fade-in-up ${theme === 'dark' ? 'bg-rose-900/20 text-rose-400 border border-rose-900/50' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuth} className="flex flex-col gap-5">
                {!isLoginView && (
                  <div className="flex flex-col sm:flex-row gap-5">
                    <input type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'}`} />
                    <input type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'}`} />
                  </div>
                )}
                
                <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'}`} />
                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'}`} />
                
                {!isLoginView && (
                  <div className="relative">
                    <select value={persona} onChange={(e) => setPersona(e.target.value)} className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none appearance-none ${theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-[#E6EAF2] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937]'}`}>
                      <option value="guest">Select Persona (Optional)</option>
                      <option value="student">Student</option>
                      <option value="homemaker">Homemaker</option>
                      <option value="professional">Professional</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                       <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                )}
                
                <button type="submit" className={`w-full mt-4 p-4 rounded-xl font-medium tracking-wide transition-all duration-500 hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] text-[#0F1117] hover:shadow-[0_0_25px_rgba(94,234,212,0.25)]' : 'bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:shadow-[0_8px_25px_rgba(99,102,241,0.25)]'}`}>
                  {isLoginView ? "Access Interface" : "Initialize Profile"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#6B7280]'}`}>
                  {isLoginView ? "New to the Nexus? " : "Returning traveler? "}
                  <button type="button" onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(""); }} className={`font-medium transition-colors duration-300 ml-1 ${theme === 'dark' ? 'text-[#5EEAD4] hover:text-white' : 'text-[#6366F1] hover:text-[#1F2937]'}`}>
                    {isLoginView ? "Initialize here." : "Access here."}
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;