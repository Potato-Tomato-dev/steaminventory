export default function LogoutButton() {
    const handleLogout = async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/"; // Redirect to home or login page
    };
  
    return <button onClick={handleLogout}>Logout</button>;
  }
  