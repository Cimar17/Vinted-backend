const express = require("express");
const router = express.Router();
const uid2 = require("uid2"); // 🔐 pour générer salt + token
const SHA256 = require("crypto-js/sha256"); // 🔐 pour crypter le password
const encBase64 = require("crypto-js/enc-base64"); // 🔐 pour encoder le hash

const User = require("../models/User");

// Test : http://localhost:3000/user
router.get("/", (req, res) => {
  res.json("Bienvenue sur l'API Auth Vinted !");
});

// 🧪 ROUTE : POST /user/signup
router.post("/signup", async (req, res) => {
  try {
    // 🎯 Étape 1 — Je récupère les infos du client
    const { email, username, password, newsletter } = req.body;

    // 🧼 Étape 2 — Je vérifie que les champs requis sont là
    if (!email || !username || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // 🔎 Étape 3 — Vérifier si l’email existe déjà en BDD
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    // 🧂 Étape 4 — Générer un salt
    const salt = uid2(24);

    // 🔐 Étape 5 — Créer un hash sécurisé (mot de passe + salt)
    const hash = SHA256(password + salt).toString(encBase64);

    // 🪪 Étape 6 — Générer un token d’identification
    const token = uid2(32);

    // 💾 Étape 7 — Créer et sauvegarder l'utilisateur dans MongoDB
    const newUser = new User({
      email: email,
      account: {
        username: username,
        avatar: {}, // vide pour l’instant
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();

    // 🎁 Étape 8 — Répondre au client (on ne renvoie pas le hash ni le salt !)
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    // 🚨 Gestion des erreurs serveur
    res.status(500).json({ message: error.message });
  }
});

// 📍 ROUTE : POST /user/login
router.post("/login", async (req, res) => {
  try {
    // 🎯 Étape 1 — Récupérer les données envoyées
    const { email, password } = req.body;

    // ⚠️ Étape 2 — Vérifier que les champs sont présents
    if (!email || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // 🔎 Étape 3 — Chercher l’utilisateur dans la BDD
    const user = await User.findOne({ email: email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // 🧠 Étape 4 — Recréer un hash à partir du password fourni et du salt en BDD
    const newHash = SHA256(password + user.salt).toString(encBase64);

    // 🧪 Étape 5 — Comparer le nouveau hash à celui stocké
    if (newHash === user.hash) {
      // ✅ Authentification réussie → on répond avec les infos utiles
      res.status(200).json({
        _id: user._id,
        token: user.token,
        account: {
          username: user.account.username,
        },
      });
    } else {
      // ❌ Mot de passe incorrect
      res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
  } catch (error) {
    // 🚨 Gestion des erreurs serveur
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
