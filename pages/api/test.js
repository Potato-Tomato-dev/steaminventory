import nc from "next-connect";

const handler = nc();

handler.get((req, res) => {
  res.json({ message: "Next-connect is working!" });
});

export default handler;
