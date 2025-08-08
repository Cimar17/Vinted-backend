const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 🔗 fait le lien avec le modèle User
  },
});

module.exports = Offer;

/*

🧠 Notes importantes :
	•	Le champ owner permet de relier l’annonce à l’utilisateur connecté
	•	product_image contient toute la réponse de Cloudinary (url, secure_url, etc.)
	•	product_details est un array d’objets (comme demandé dans l’exemple)


*/
