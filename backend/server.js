// server/index.js
const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors()); // Permite frontend-ului să facă request-uri
app.use(express.json()); // Permite citirea datelor JSON

// Ruta de test
app.get("/", (req, res) => {
  res.send({ message: "Serverul functioneaza!" });
});

// Pornire server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Serverul ruleaza pe portul ${PORT}`);
});
