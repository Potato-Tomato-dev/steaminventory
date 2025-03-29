"use client";
import { useEffect, useState } from "react";

export default function Inventory() {
  const [steamId, setSteamId] = useState(null);
  const [items, setItems] = useState([]);
  const [game, setGame] = useState("cs2");
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.user.id) {
          setSteamId(data.user.id);
        }
      });
  }, []);

  const fetchInventory = async () => {
    if (!steamId) return; // Don't fetch if steamId is not available
    try {
      const response = await fetch(`/api/inventory?steamId=${steamId}&game=${game}`);
      const data = await response.json();
      if (data && data.assets) {
        const tradableItems = data.assets
          .map((asset) => {
            const description = data.descriptions.find(desc => desc.classid === asset.classid);
            return { ...asset, ...description };
          })
          .filter(item => item.tradable === 1); // ✅ Only include tradable items
  
        setItems(tradableItems);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };
  

  const toggleSelectItem = (item) => {
    setSelectedItems((prevSelected) =>
      prevSelected.some((i) => i.assetid === item.assetid)
        ? prevSelected.filter((i) => i.assetid !== item.assetid)
        : [...prevSelected, item]
    );
  };

  const sendTrade = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: selectedItems,
          userTradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=144127921&token=veNuo9dc", // Replace with your active bot Steam ID
        }),
      });
      const data = await response.json();
      console.log(data);
      if (data.success) {
        alert("✅ Trade sent successfully!");
        setSelectedItems([]); // Clear selection after trade
      } else {
        alert("❌ Trade failed: " + data.error);
      }
    } catch (error) {
      console.error("Trade Error:", error);
      alert("Trade request failed.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{game === "cs2" ? "CS2" : "Dota 2"} Inventory</h2>
      <button onClick={() => setGame("cs2")}>CS2</button>
      <button onClick={() => setGame("dota2")}>Dota 2</button>
      <button onClick={fetchInventory}>Fetch Inventory</button>
      <button onClick={sendTrade} disabled={selectedItems.length === 0}>
        Send Trade
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                border: selectedItems.some((i) => i.assetid === item.assetid) ? "2px solid yellow" : "1px solid #ccc",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
                backgroundColor: "#222",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={() => toggleSelectItem(item)}
            >
              <img
                src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
                alt={item.name}
                style={{ width: "100px", height: "100px", borderRadius: "5px" }}
              />
              <h3 style={{ color: `#${item.name_color || "ffffff"}` }}>{item.name}</h3>
              <p>{item.type}</p>
              <p style={{ color: item.tradable ? "green" : "red" }}>
                {item.tradable ? "Tradable" : "Not Tradable"}
              </p>
            </div>
          ))
        ) : (
          <p>No items found.</p>
        )}
      </div>
    </div>
  );
}
