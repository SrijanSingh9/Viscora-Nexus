import React, { useState, useEffect } from "react";

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [profileData, setProfileData] = useState<any>(null);
  
  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persona, setPersona] = useState("guest");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Persona State
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [newPersona, setNewPersona] = useState("");

  // Reflection Engine State
  const [mood, setMood] = useState<string | null>(null);
  const [reflectionInput, setReflectionInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reflectionsHistory, setReflectionsHistory] = useState<any[]>([]);

  // Toggle dark class on document body
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Fetch secure profile data and reflection history if logged in
  useEffect(() => {
    if (token) {
      // Fetch Profile
      fetch("http://127.0.0.1:8000/api/profile/", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Token expired");
        return res.json();
      })
      .then(data => setProfileData(data))
      .catch(() => handleLogout()); 

      // Fetch Reflection History
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

    const url = isLoginView 
      ? "http://127.0.0.1:8000/api/login/" 
      : "http://127.0.0.1:8000/api/signup/";

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
      console.warn("Backend PATCH not ready, updating UI locally.");
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: reflectionInput, mood: mood }),
      });

      if (res.ok) {
        const newReflection = await res.json();
        // Prepend new reflection to history to show it immediately at the top
        setReflectionsHistory([newReflection, ...reflectionsHistory]);
        setReflectionInput("");
        setMood(null);
      }
    } catch (err) {
      console.error("Failed to analyze reflection:", err);
    } finally {
      setIsAnalyzing(false);
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

  // Upgraded logic to prioritize the first name from the database
  const getDisplayName = () => {
    if (!profileData) return "";
    return profileData.first_name || profileData.name || profileData.username?.split('@')[0] || "Traveler";
  };

  const getMoodEmoji = (moodStr: string) => {
    switch(moodStr) {
      case 'calm': return '😌';
      case 'thinking': return '🤔';
      case 'low': return '😞';
      case 'motivated': return '🔥';
      default: return '✨';
    }
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-700 font-['Inter',sans-serif] selection:bg-[#5EEAD4] selection:text-[#0F1117] ${
      theme === 'dark' 
        ? 'bg-[#0F1117] text-[#E6EAF2]' 
        : 'bg-[#F7F8FB] text-[#1F2937] selection:bg-[#6366F1] selection:text-white'
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&family=Source+Serif+4:ital,wght@0,300;0,400;1,300;1,400&display=swap');
      `}</style>

      {/* Ambient Background Glow (Fixed positioning) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none blur-[120px] transition-all duration-1000 z-0"
           style={{ background: theme === 'dark' ? 'radial-gradient(circle, #5EEAD4 0%, transparent 70%)' : 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} />

      {/* Theme Toggle Button */}
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={`fixed top-6 right-6 sm:top-8 sm:right-8 p-3 rounded-full backdrop-blur-md transition-all duration-500 hover:scale-110 active:scale-95 z-50 ${
          theme === 'dark' 
            ? 'bg-[#1D2230]/80 text-[#5EEAD4] hover:bg-[#2A3040] shadow-[0_0_15px_rgba(94,234,212,0.1)]' 
            : 'bg-white/80 text-[#6366F1] hover:bg-[#F1F3F9] shadow-[0_4px_15px_rgba(0,0,0,0.05)]'
        }`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        
        {/* --- RENDER DASHBOARD IF LOGGED IN --- */}
        {token ? (
          <div className="w-full max-w-3xl animate-fade-in-up pb-20">
            <header className="mb-10 text-center">
              <h1 className="text-3xl sm:text-4xl font-light tracking-widest mb-2">
                VISCORA <span className={`font-normal ${theme === 'dark' ? 'text-[#5EEAD4]' : 'text-[#6366F1]'}`}>NEXUS</span>
              </h1>
            </header>
            
            {profileData ? (
              <>
                <div className={`p-6 sm:p-10 rounded-3xl transition-all duration-500 mb-10 relative z-20 ${
                  theme === 'dark' 
                    ? 'bg-[#161A23] border border-[#2A3040] shadow-[0_8px_30px_rgba(0,0,0,0.45)]' 
                    : 'bg-white border border-[#E3E6EF] shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
                }`}>
                  
                  {/* Greeting */}
                  <div className="mb-10 text-center sm:text-left">
                    <h2 className="text-3xl sm:text-4xl font-light mb-2">
                      Welcome back, <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-[#5EEAD4] dark:to-[#A78BFA]">{getDisplayName()}</span>.
                    </h2>
                  </div>

                  {/* Status & Persona Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Persona Widget */}
                    <div className={`p-5 rounded-2xl transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F1117] border border-[#1D2230]' : 'bg-[#F7F8FB] border border-[#F1F3F9]'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs uppercase tracking-widest font-medium ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#9CA3AF]'}`}>Active Persona</span>
                        {!isEditingPersona && (
                          <button 
                            onClick={() => { setIsEditingPersona(true); setNewPersona(profileData.persona); }}
                            className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition-all duration-300 ${
                              theme === 'dark' ? 'bg-[#2A3040] hover:bg-[#5EEAD4] hover:text-[#0F1117]' : 'bg-[#E3E6EF] hover:bg-[#6366F1] hover:text-white'
                            }`}
                          >
                            Configure
                          </button>
                        )}
                      </div>

                      {isEditingPersona ? (
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 animate-fade-in-up">
                          <select 
                            value={newPersona} 
                            onChange={(e) => setNewPersona(e.target.value)}
                            className={`flex-1 p-2 rounded-xl text-sm border focus:outline-none transition-all duration-300 ${
                              theme === 'dark' 
                                ? 'bg-[#161A23] border-[#2A3040] text-white focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]' 
                                : 'bg-white border-[#E3E6EF] text-[#1F2937] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]'
                            }`}
                          >
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
                        <span className="text-2xl font-light capitalize tracking-wide">{profileData.persona}</span>
                      )}
                    </div>

                    {/* Mood Widget */}
                    <div className={`p-5 rounded-2xl transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F1117] border border-[#1D2230]' : 'bg-[#F7F8FB] border border-[#F1F3F9]'}`}>
                      <span className={`block text-xs uppercase tracking-widest font-medium mb-4 ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#9CA3AF]'}`}>State of Mind</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'calm', icon: '😌', color: theme === 'dark' ? 'hover:bg-[#34D399]/20 hover:text-[#34D399] hover:border-[#34D399]' : 'hover:bg-[#34D399]/10 hover:text-[#059669] hover:border-[#34D399]' },
                          { id: 'thinking', icon: '🤔', color: theme === 'dark' ? 'hover:bg-[#A78BFA]/20 hover:text-[#A78BFA] hover:border-[#A78BFA]' : 'hover:bg-[#A78BFA]/10 hover:text-[#7C3AED] hover:border-[#A78BFA]' },
                          { id: 'low', icon: '😞', color: theme === 'dark' ? 'hover:bg-[#60A5FA]/20 hover:text-[#60A5FA] hover:border-[#60A5FA]' : 'hover:bg-[#60A5FA]/10 hover:text-[#2563EB] hover:border-[#60A5FA]' },
                          { id: 'motivated', icon: '🔥', color: theme === 'dark' ? 'hover:bg-[#22D3EE]/20 hover:text-[#22D3EE] hover:border-[#22D3EE]' : 'hover:bg-[#22D3EE]/10 hover:text-[#0891B2] hover:border-[#22D3EE]' },
                        ].map(m => (
                          <button 
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={`flex justify-center items-center p-3 rounded-xl transition-all duration-300 border bg-transparent ${
                              mood === m.id 
                                ? (theme === 'dark' ? 'bg-[#5EEAD4]/10 border-[#5EEAD4] opacity-100 scale-105' : 'bg-[#6366F1]/10 border-[#6366F1] opacity-100 scale-105') 
                                : (theme === 'dark' ? 'border-transparent opacity-50 hover:opacity-100' : 'border-transparent opacity-60 hover:opacity-100')
                            } ${m.color}`}
                          >
                            <span className="text-2xl filter drop-shadow-sm">{m.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reflection Journal Input Area */}
                  <div className="mb-6 relative z-30">
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
                    <div className="flex justify-end mt-4 gap-4 items-center relative z-30">
                      <button 
                        onClick={handleLogout} 
                        className={`text-sm tracking-wide px-4 py-2 rounded-xl transition-all duration-300 ${
                          theme === 'dark' ? 'text-[#6B7280] hover:text-[#A4A9B6]' : 'text-[#9CA3AF] hover:text-[#4B5563]'
                        }`}
                      >
                        Disconnect
                      </button>
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
                            Analyzing...
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
                      {reflectionsHistory.map((ref) => (
                        <div key={ref.id} className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'bg-[#161A23] border border-[#2A3040]' 
                            : 'bg-white border border-[#E3E6EF] shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                        }`}>
                          <div className="flex items-center gap-3 mb-4 opacity-80">
                            {ref.mood && <span className="text-xl">{getMoodEmoji(ref.mood)}</span>}
                            <span className={`text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                              {new Date(ref.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          
                          {/* User's Original Input */}
                          <p className="font-['Source_Serif_4'] text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                            {ref.content}
                          </p>

                          {/* AI Insight */}
                          {ref.ai_insight && (
                            <div className={`p-5 rounded-2xl relative overflow-hidden ${
                              theme === 'dark' ? 'bg-[#0F1117]/80' : 'bg-[#F7F8FB]'
                            }`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${theme === 'dark' ? 'bg-[#5EEAD4]' : 'bg-[#6366F1]'}`}></div>
                              <span className={`block text-[10px] uppercase tracking-widest font-medium mb-2 ${theme === 'dark' ? 'text-[#5EEAD4]' : 'text-[#6366F1]'}`}>
                                Nexus Insight
                              </span>
                              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#4B5563]'}`}>
                                {ref.ai_insight}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
              theme === 'dark' 
                ? 'bg-[#161A23] border border-[#2A3040] shadow-[0_8px_30px_rgba(0,0,0,0.45)]' 
                : 'bg-white border border-[#E3E6EF] shadow-[0_10px_40px_rgba(0,0,0,0.06)]'
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
                    <input 
                      type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} 
                      className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${
                        theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'
                      }`} 
                    />
                    <input 
                      type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} 
                      className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${
                        theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'
                      }`} 
                    />
                  </div>
                )}
                
                <input 
                  type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} 
                  className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${
                    theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'
                  }`} 
                />
                
                <input 
                  type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                  className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none ${
                    theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-white placeholder-[#6B7280] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937] placeholder-[#9CA3AF]'
                  }`} 
                />
                
                {!isLoginView && (
                  <div className="relative">
                    <select 
                      value={persona} onChange={(e) => setPersona(e.target.value)} 
                      className={`w-full p-4 rounded-xl text-sm transition-all duration-300 border-none focus:ring-2 focus:outline-none appearance-none ${
                        theme === 'dark' ? 'bg-[#0F1117] focus:ring-[#5EEAD4]/50 text-[#E6EAF2] shadow-inner' : 'bg-[#F7F8FB] focus:ring-[#6366F1]/50 text-[#1F2937]'
                      }`}
                    >
                      <option value="guest">Select Persona (Optional)</option>
                      <option value="student">Student</option>
                      <option value="homemaker">Homemaker</option>
                      <option value="professional">Professional</option>
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                       <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className={`w-full mt-4 p-4 rounded-xl font-medium tracking-wide transition-all duration-500 hover:scale-[1.02] active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] text-[#0F1117] hover:shadow-[0_0_25px_rgba(94,234,212,0.25)]' 
                      : 'bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:shadow-[0_8px_25px_rgba(99,102,241,0.25)]'
                  }`}
                >
                  {isLoginView ? "Access Interface" : "Initialize Profile"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-[#A4A9B6]' : 'text-[#6B7280]'}`}>
                  {isLoginView ? "New to the Nexus? " : "Returning traveler? "}
                  <button 
                    type="button"
                    onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(""); }} 
                    className={`font-medium transition-colors duration-300 ml-1 ${theme === 'dark' ? 'text-[#5EEAD4] hover:text-white' : 'text-[#6366F1] hover:text-[#1F2937]'}`}
                  >
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