'use client';
import { useEffect, useState } from "react";

export default function Inventory() {
  const [steamId, setSteamId] = useState(null);
  const [items, setItems] = useState([]);
  const [game, setGame] = useState("cs2");

  useEffect(() => {
    // Fetch the Steam ID from the API when the component mounts
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.user.id) {
          setSteamId(data.user.id); // Store Steam ID in the state
        }
      });
  }, []);

  const fetchInventory = async () => {
    if (!steamId) return; // Don't fetch if steamId is not available
    try {
      const response = await fetch(`/api/inventory?steamId=${steamId}&game=${game}`);
      const data = await response.json();
      if (data && data.assets) {
        setItems(data.assets.map((asset) => {
          const description = data.descriptions.find(desc => desc.classid === asset.classid);
          console.log(asset.assetid)
          console.log(asset)
          return { ...asset, ...description };
        }));
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  // const fetchInventory = async (steamId, game) => {
  //   try {
  //     const response = await fetch(`/api/inventory?steamId=${steamId}&game=${game}`);
  //     const data = await response.json();
  //     return data.assets.filter(item => item.tradable === 1); // Only tradable items
  //   } catch (error) {
  //     console.error("Failed to fetch inventory:", error);
  //     return [];
  //   }
  // };
  

  return (
    <div style={{ padding: "20px" }}>
      <h2>{game === "cs2" ? "CS2" : "Dota 2"} Inventory</h2>
      <button onClick={() => setGame("cs2")}>CS2</button>
      <button onClick={() => setGame("dota2")}>Dota 2</button>
      <button onClick={fetchInventory}>Fetch Inventory</button>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "20px" }}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
              backgroundColor: "#222",
              color: "#fff"
            }}>
              <img src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`} alt={item.name} style={{ width: "100px", height: "100px", borderRadius: "5px" }} />
              <h3 style={{ color: `#${item.name_color || "ffffff"}` }}>{item.name}</h3>
              <p>{item.type}</p>
              <p style={{ color: item.tradable ? "green" : "red" }}>
                {item.tradable ? "Tradable" : "Not Tradable"}
              </p>
              <p style={{ color: item.marketable ? "blue" : "gray" }}>
                {item.marketable ? "Marketable" : "Not Marketable"}
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
