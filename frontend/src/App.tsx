import { useEffect, useState } from "react";

function App() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [persona, setPersona] = useState("guest"); // Defaults to guest for privacy

  const fetchProfiles = () => {
    fetch("http://127.0.0.1:8000/api/profiles/")
      .then((res) => res.json())
      .then((data) => setProfiles(data))
      .catch((err) => console.error("Error fetching profiles:", err));
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://127.0.0.1:8000/api/profiles/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, persona }),
      });
      fetchProfiles(); // Refresh the list to show the newly added user
      setUsername(""); // Clear the input fields
      setPassword("");
    } catch (err) {
      console.error("Sign up failed:", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🌌 Viscora Nexus: Sign Up</h1>
      
      <form onSubmit={handleSignUp} style={{ marginBottom: "30px", display: "flex", gap: "10px" }}>
        <input 
          type="text" placeholder="Username" required
          value={username}
          onChange={(e) => setUsername(e.target.value)} 
        />
        <input 
          type="password" placeholder="Password" required
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />
        <select onChange={(e) => setPersona(e.target.value)} value={persona}>
          <option value="guest">Prefer not to say (Guest)</option>
          <option value="student">Student</option>
          <option value="homemaker">Homemaker</option>
          <option value="professional">Professional</option>
        </select>
        <button type="submit">Sign Up</button>
      </form>

      <hr />

      <h2>Registered Users</h2>
      <div style={{ display: "grid", gap: "10px", marginTop: "20px" }}>
        {profiles.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
            <h3 style={{ margin: "0 0 5px 0" }}>{p.username}</h3>
            <p style={{ margin: 0 }}>Persona: <strong>{p.persona}</strong></p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;