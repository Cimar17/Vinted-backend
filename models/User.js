const mongoose = require("mongoose");

// 🧠 Je définis la structure d’un utilisateur
const User = mongoose.model("User", {
  email: { type: String, required: true }, // ✉️ identifiant unique
  account: {
    username: { type: String, required: true }, // 👤 pseudo visible
    avatar: Object, // 🖼 optionnel, pour plus tard
  },
  newsletter: Boolean, // 📰 inscrit à la newsletter ou non
  token: String, // 🪪 identifiant unique généré avec uid2
  hash: String, // 🔐 mot de passe crypté
  salt: String, // 🧂 composant de sécurité ajouté au mot de passe
});

module.exports = User;

/*
🔎 Ce modèle correspond à :

{
  "email": "johndoe@mail.com",
  "account": {
    "username": "JohnDoe",
    "avatar": {}
  },
  "newsletter": true,
  "token": "xYZ456...",
  "hash": "Z8Hj4nLo7...",
  "salt": "a1b2c3..."
}




{
  email: String,
  account: {
    username: String,
    avatar: Object, // nous verrons plus tard comment uploader une image
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
}

*/
