// 🌐 1. IMPORT DES PACKAGES
const express = require("express"); // 🧱 Framework serveur
const mongoose = require("mongoose"); // 🔗 Pour connecter MongoDB
const cloudinary = require("cloudinary").v2; // ☁️ Pour héberger les images
const cors = require("cors");
require("dotenv").config();

// 🛠 2. CONFIG CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🚀 3. INITIALISATION DU SERVEUR
const app = express();

// 🧰 4. MIDDLEWARES GÉNÉRAUX
app.use(cors());
app.use(express.json()); // 📩 Pour lire le body JSON (SignUp, Login, etc.)

// 🔌 5. CONNEXION À LA BASE DE DONNÉES
mongoose.connect(process.env.MONGODB_URI);

// 📦 5bis. IMPORT DES MODÈLES DE DONNÉES (User, Offer)
const User = require("./models/User");
const Offer = require("./models/Offer");

// 🚦 6. IMPORT DES ROUTES
const userRoutes = require("./routes/user"); // 🔐 Sign Up / Login
const offerRoutes = require("./routes/offer"); // 📦 Publication d'annonce (protégée)

// 🔀  7. MONTAGE DES ROUTES
app.use(userRoutes); // → /user/signup, /user/login
app.use(offerRoutes); // → /offer/publish

// 📡 8. ROUTE DE TEST (accueil)
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l’API Vinted 🧥" });
});

// 🔴 9. 404 — Route inexistante
app.all("/*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

// 🟢 🌈  10. LANCEMENT DU SERVEUR
const PORT = process.env.PORT || 3000; // <- fallback local
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
