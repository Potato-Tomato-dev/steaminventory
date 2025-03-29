import { useState, useEffect } from "react";
import Inventory from "../components/Inventory";

export default function Trade() {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [recipientSteamId, setRecipientSteamId] = useState(""); // The bot's Steam ID

  useEffect(() => {
    // Fetch user inventory
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => setItems(data.assets || []));
  }, []);

  const handleSelectItem = (item) => {
    setSelectedItems((prev) =>
      prev.find((i) => i.assetid === item.assetid)
        ? prev.filter((i) => i.assetid !== item.assetid)
        : [...prev, item]
    );
  };

  const sendTrade = async () => {
    const response = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientSteamId,
        items: selectedItems.map((item) => item.assetid),
      }),
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
      <h2>Trade Items</h2>
      <input
        type="text"
        placeholder="Recipient Steam ID"
        value={recipientSteamId}
        onChange={(e) => setRecipientSteamId(e.target.value)}
      />
      <Inventory items={items} onSelectItem={handleSelectItem} />
      <button onClick={sendTrade}>Send Trade</button>
    </div>
  );
}
