export default function BotPage() {
  const startBot = async () => {
    const response = await fetch("/api/bot", { method: "POST" });
    const data = await response.json();
    alert(data.message || data.error);
  };

  return (
    <div>
      <h2>Start Steam Bot</h2>
      <button onClick={startBot}>Start Bot</button>
    </div>
  );
}
