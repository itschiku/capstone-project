import { useState, useEffect } from 'react'

const BACKENDS = [
  { id: 'fastapi', name: 'FastAPI', color: '#009688', port: 8000, url: 'http://localhost:8000' },
  { id: 'nodejs', name: 'Node.js', color: '#43A047', port: 5000, url: 'http://localhost:5000' },
  { id: 'django', name: 'Django', color: '#1565C0', port: 8080, url: 'http://localhost:8080' },
  { id: 'dotnet', name: '.NET', color: '#6A1B9A', port: 7000, url: 'http://localhost:7000' },
]

function App() {
  const [activeBackend, setActiveBackend] = useState('fastapi')
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [backendStatus, setBackendStatus] = useState({})

  const currentBackend = BACKENDS.find(b => b.id === activeBackend)

  const checkHealth = async (backendId) => {
    const backend = BACKENDS.find(b => b.id === backendId)
    try {
      const response = await fetch(`${backend.url}/health`)
      if (response.ok) {
        setBackendStatus(prev => ({ ...prev, [backendId]: true }))
        setMessage(`${backend.name} is online ✅`)
      } else {
        setBackendStatus(prev => ({ ...prev, [backendId]: false }))
        setMessage(`${backend.name} is offline ❌`)
      }
    } catch (error) {
      setBackendStatus(prev => ({ ...prev, [backendId]: false }))
      setMessage(`${backend.name} is offline ❌`)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${currentBackend.url}/users`)
      const data = await response.json()
      setUsers(data)
      setMessage(`Loaded ${data.length} users from ${currentBackend.name}`)
    } catch (error) {
      setMessage(`Failed to fetch users from ${currentBackend.name}`)
    }
    setLoading(false)
  }

  const addUser = async () => {
    if (!name || !email) {
      setMessage('Please fill in both fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${currentBackend.url}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      if (response.ok) {
        setMessage(`User "${name}" added successfully!`)
        setName('')
        setEmail('')
        await fetchUsers()
      } else {
        const error = await response.json()
        setMessage(`Failed to add user: ${error.error || error.detail}`)
      }
    } catch (error) {
      setMessage('Failed to add user')
    }
    setLoading(false)
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return

    setLoading(true)
    try {
      const response = await fetch(`${currentBackend.url}/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage('User deleted successfully!')
        await fetchUsers()
      } else {
        setMessage('Failed to delete user')
      }
    } catch (error) {
      setMessage('Failed to delete user')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
    checkHealth(activeBackend)
  }, [activeBackend])

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a237e, #3949ab)', color: 'white', padding: '30px', textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Multi-Backend Capstone Project</h1>
        <p style={{ marginTop: '10px' }}>React ↔ FastAPI | Node.js | Django | .NET Core ↔ MySQL</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {BACKENDS.map(backend => (
            <div
              key={backend.id}
              onClick={() => setActiveBackend(backend.id)}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                border: activeBackend === backend.id ? `3px solid ${backend.color}` : '1px solid #ddd',
                boxShadow: activeBackend === backend.id ? `0 0 10px ${backend.color}` : 'none',
              }}
            >
              <h3 style={{ color: backend.color, margin: 0 }}>{backend.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>Port: {backend.port}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  checkHealth(backend.id)
                }}
                style={{
                  marginTop: '10px',
                  padding: '5px 15px',
                  background: backend.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Check Health
              </button>
              {backendStatus[backend.id] !== undefined && (
                <p style={{ marginTop: '10px', fontWeight: 'bold', color: backendStatus[backend.id] ? 'green' : 'red' }}>
                  {backendStatus[backend.id] ? '🟢 Online' : '🔴 Offline'}
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ background: currentBackend.color, color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <strong>Active Backend: {currentBackend.name}</strong> (Port: {currentBackend.port})
        </div>

        {message && (
          <div style={{ background: '#e8eaf6', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3>Add New User</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
            <button
              onClick={addUser}
              disabled={loading}
              style={{ padding: '10px 20px', background: currentBackend.color, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{ padding: '10px 20px', background: '#455a64', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Fetch Users
            </button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '10px' }}>
          <h3>Users List</h3>
          {loading && <p>Loading...</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No users found. Add one above!</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{user.id}</td>
                    <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{user.name}</td>
                    <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{user.email}</td>
                    <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{ background: '#fce4ec', color: '#c62828', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                      >
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
    </div>
  )
}

export default App
