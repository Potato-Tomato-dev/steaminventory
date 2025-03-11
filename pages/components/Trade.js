import { useState } from "react";

export default function Trade() {
  const [steamId, setSteamId] = useState("");
  const [tradeUrl, setTradeUrl] = useState("");
  const [items, setItems] = useState([]);

  const sendTrade = async () => {
    const response = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId, tradeUrl, items }),
    });
    const data = await response.json();
    if (data.success) {
      alert(`Trade Offer Sent: ${data.tradeUrl}`);
    } else {
      alert("Trade Failed: " + data.error);
    }
  };

  return (
    <div>
      <h2>Trade System</h2>
      <input type="text" placeholder="Steam ID" onChange={(e) => setSteamId(e.target.value)} />
      <input type="text" placeholder="Trade URL" onChange={(e) => setTradeUrl(e.target.value)} />
      <button onClick={sendTrade}>Send Trade</button>
      
      <p>
        Don't know your trade URL? Find it <a href="https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url" target="_blank" rel="noopener noreferrer">here</a>.
      </p>
    </div>
  );
}
