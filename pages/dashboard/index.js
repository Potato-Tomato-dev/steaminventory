import { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  console.log("wot");
  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  return (
    <div>
      <h1>Steam Authentication with Next.js</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.displayName}</h2>
          <img src={user.photos[0].value} alt="Avatar" width={100} />
          <br />
          <a href="/api/auth/logout">
            <button>Logout</button>
          </a>
        </div>
      ) : (
        <a href="/api/auth/steam">
          <button>Login with Steam</button>
        </a>
      )}
    </div>
  );
}
