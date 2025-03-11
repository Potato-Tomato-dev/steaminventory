import { useState, useEffect } from "react";
import Inventory from "../components/Inventory";
import Trade from "../components/Trade";

export default function User() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch the authenticated user
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user); // Set the user data in state
        }
      })
      .catch((err) => console.error("Failed to fetch user:", err));
  }, []);

  const handleLogout = async () => {
    // Call your logout API route (this can clear the session)
    await fetch("/api/auth/logout");
    setUser(null); // Reset user state
  };

  return (
    <div>
      <h1>Steam Authentication with Next.js</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.displayName}</h2>
          <button onClick={handleLogout}>Logout</button>
          <Inventory />
          <Trade/>
        </div>
      ) : (
        <a href="/api/auth/steam">
          <button>Login with Steam</button>
        </a>
      )}
    </div>
  );
}
