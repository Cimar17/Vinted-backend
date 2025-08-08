const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // 🔐 1. Récupère le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized - Token manquant" });
    }

    // 🔎 2. Extrait le token du header "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");

    // 👤 3. Recherche de l'utilisateur correspondant au token
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - Token invalide" });
    }

    // ✅ 4. Authentification réussie → injection dans req
    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
