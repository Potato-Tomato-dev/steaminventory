import { useState } from "react";

export default function TradeSettings() {
  const [tradeUrl, setTradeUrl] = useState("");

  const handleSave = async () => {
    await fetch("/api/save-trade-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeUrl }),
    });
    alert("Trade URL saved!");
  };

  return (
    <div>
      <h2>Enter Your Steam Trade URL</h2>
      <input
        type="text"
        placeholder="Enter Trade URL..."
        value={tradeUrl}
        onChange={(e) => setTradeUrl(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
