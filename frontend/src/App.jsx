import { useState, useEffect } from "react";

// Using Nginx load balancer endpoints
const API_ENDPOINTS = {
  fastapi: import.meta.env.VITE_FASTAPI_URL || "http://localhost/api/fastapi",
  nodejs: import.meta.env.VITE_NODEJS_URL || "http://localhost/api/nodejs",
  springboot: import.meta.env.VITE_SPRINGBOOT_URL || "http://localhost/api/springboot",
  dotnet: import.meta.env.VITE_DOTNET_URL || "http://localhost/api/dotnet",
};

const BACKENDS = [
  { id: "fastapi", name: "FastAPI",  lang: "Python",     color: "#009688", port: 8000 },
  { id: "nodejs",  name: "Node.js",  lang: "JavaScript", color: "#43A047", port: 5000 },
  { id: "springboot",  name: "Spring Boot",  lang: "Java",     color: "#FF5722", port: 8080 },
  { id: "dotnet",  name: ".NET",     lang: "C#",         color: "#6A1B9A", port: 7000 },
];

export default function App() {
  const [active, setActive] = useState("fastapi");
  const [users, setUsers]   = useState([]);
  const [form, setForm]     = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState("");
  const [health, setHealth] = useState({});

  const base = API_ENDPOINTS[active];
  const info = BACKENDS.find(b => b.id === active);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${base}/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setMsg(`✅ Loaded ${data.length} users from ${info.name}`);
    } catch (error) {
      setMsg(`❌ Cannot connect to ${info.name}`);
      setUsers([]);
    }
    setLoading(false);
  };

  const addUser = async () => {
    if (!form.name || !form.email) {
      setMsg("⚠️ Fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${base}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.detail || "Failed");
      
      setMsg(`✅ User "${form.name}" added successfully!`);
      setForm({ name: "", email: "" });
      await fetchUsers();
    } catch (error) {
      setMsg(`❌ Failed to add user: ${error.message}`);
    }
    setLoading(false);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${base}/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMsg(`✅ User deleted`);
      await fetchUsers();
    } catch (error) {
      setMsg(`❌ Failed to delete user`);
    }
    setLoading(false);
  };

  const checkHealth = async (id) => {
    try {
      const res = await fetch(`${API_ENDPOINTS[id]}/health`);
      if (res.ok) {
        setHealth(h => ({ ...h, [id]: "online" }));
        setMsg(`✅ ${id} backend is online`);
      } else {
        setHealth(h => ({ ...h, [id]: "error" }));
      }
    } catch (error) {
      setHealth(h => ({ ...h, [id]: "offline" }));
      setMsg(`❌ ${id} backend is offline`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [active]);

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", minHeight: "100vh", background: "#f0f2f5", color: "#222" }}>
      <div style={{ background: "linear-gradient(135deg, #1a237e, #3949ab)", color: "#fff", padding: "24px 32px" }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>Multi-Backend Capstone Project</h1>
        <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 13 }}>React → Nginx Load Balancer → FastAPI | Node.js | Spring Boot | .NET → MySQL</p>
      </div>

      <div style={{ maxWidth: 1000, margin: "32px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: 16, marginBottom: 14, color: "#1a237e" }}>Choose Backend</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
          {BACKENDS.map(b => (
            <div key={b.id}
              onClick={() => { setActive(b.id); setUsers([]); setMsg(`Switched to ${b.name} via Nginx`); }}
              style={{ background: "#fff", borderRadius: 12, padding: "18px 16px",
                border: `2px solid ${active === b.id ? b.color : "#e0e0e0"}`,
                cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: b.color }}>{b.name}</div>
              <div style={{ fontSize: 12, color: "#888", margin: "4px 0 10px" }}>{b.lang}</div>
              <button onClick={e => { e.stopPropagation(); checkHealth(b.id); }}
                style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: `1px solid ${b.color}`, background: "transparent", color: b.color, cursor: "pointer" }}>
                Check Health
              </button>
              {health[b.id] && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: health[b.id] === "online" ? "#388e3c" : "#c62828" }}>
                  {health[b.id] === "online" ? "🟢 Online" : "🔴 Offline"}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ background: info.color, color: "#fff", borderRadius: 8, padding: "10px 16px", marginBottom: 24 }}>
          Active: {info.name} via Nginx Load Balancer (Round Robin)
        </div>

        {msg && <div style={{ background: "#e8eaf6", borderLeft: "4px solid #3f51b5", padding: "10px 16px", borderRadius: 6, marginBottom: 16 }}>{msg}</div>}

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: 8 }} />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: 8 }} />
          <button onClick={addUser} style={{ padding: "10px 20px", background: info.color, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Add User
          </button>
          <button onClick={fetchUsers} style={{ padding: "10px 20px", background: "#455a64", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Fetch Users
          </button>
        </div>

        {loading && <div>Loading...</div>}

        <table style={{ width: "100%", background: "#fff", borderRadius: 10, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 12, textAlign: "left" }}>ID</th>
              <th style={{ padding: 12, textAlign: "left" }}>Name</th>
              <th style={{ padding: 12, textAlign: "left" }}>Email</th>
              <th style={{ padding: 12, textAlign: "left" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No users yet. Add one above. </td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: 10, borderTop: "1px solid #f0f0f0" }}>{u.id}</td>
                  <td style={{ padding: 10, borderTop: "1px solid #f0f0f0" }}>{u.name}</td>
                  <td style={{ padding: 10, borderTop: "1px solid #f0f0f0" }}>{u.email}</td>
                  <td style={{ padding: 10, borderTop: "1px solid #f0f0f0" }}>
                    <button onClick={() => deleteUser(u.id)} style={{ background: "#fce4ec", color: "#c62828", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>
                      Delete
                    </button>
                   </td>
                 </tr>
              ))
            )}
          </tbody>
         </table>
      </div>
    </div>
  );
}
