import React, { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:5000/api/test')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Backend connection failed:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Full-Stack App</h1>
      {data ? (
        <div>
          <p>✅ {data.message}</p>
          <p>Database time: {new Date(data.databaseTime).toLocaleString()}</p>
        </div>
      ) : (
        <p>❌ Cannot connect to backend</p>
      )}
    </div>
  )
}

export default App