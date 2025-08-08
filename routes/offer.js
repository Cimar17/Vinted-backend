const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const convertToBase64 = (file) => {
  // 🔧 Fonction utilitaire pour convertir une image en Base64
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
const cloudinary = require("cloudinary").v2; // ☁️ Pour uploader l'image sur Cloudinary // 🧱 import local // 🖼 Pour gérer les fichiers envoyés via form-data
const isAuthenticated = require("../middlewares/isAuthenticated"); // 🛡 Import du garde du corps : Middleware de protection

const User = require("../models/User"); // 📦 Modèle User
const Offer = require("../models/Offer"); // 📦 Modèle Offer

// ROUTE POUR PUBLIER UNE ANNONCE : 🧥 POST /offer/publish — protégé + upload ponctuel
router.post(
  "/offer/publish",
  isAuthenticated, // 🔐 Middleware d’auth
  fileUpload(), // 🖼️ Middleware ponctuel
  async (req, res) => {
    // Cette route est désormais protégée 💪
    try {
      // 🧠 1. On extrait les infos texte envoyées en form-data
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      // 🏗 2. On construit un nouvel objet Offer (annonce)
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],

        owner: req.user, // 👤 L'utilisateur connecté (injecté par le middleware isAuthenticated )
      });

      // 🖼 3. On convertit l'image reçue (clé : picture) en base64
      if (req.files) {
        // 🖼️ Conversion en base64
        const convertedPicture = convertToBase64(req.files.picture);
        // ☁️ 4. On envoie l'image sur Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(
          convertedPicture
        );
        newOffer.product_image = uploadResponse; // ☁️ Toute la réponse Cloudinary (inclut secure_url)
      }

      // 💾 5. On sauvegarde en base de données
      await newOffer.save();

      // 📤 6. On renvoie l'annonce créée
      return res.status(201).json(newOffer);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// ROUTE GET /offers — récupère une liste d’annonces avec filtres, tri, pagination
router.get("/offers", async (req, res) => {
  try {
    // 🧺 1. On prépare deux objets vides :
    // 👉 filters : contiendra les critères dynamiques (titre, prix, etc.)
    // 👉 sort : contiendra la règle de tri si l'utilisateur en a demandé un
    const filters = {};
    const sort = {};

    // 🔍 2. FILTRE : Recherche par titre (optionnel)
    // Si l'utilisateur a écrit quelque chose dans un champ de recherche "titre"
    if (req.query.title) {
      // On utilise une RegExp insensible à la casse (le "i") pour matcher le nom du produit
      filters.product_name = new RegExp(req.query.title, "i");
    }

    // 💰 3. FILTRE : Prix minimum
    if (req.query.priceMin) {
      filters.product_price = { $gte: Number(req.query.priceMin) };
      // $gte = "greater than or equal" = supérieur ou égal
    }

    // 💸 4. FILTRE : Prix maximum
    if (req.query.priceMax) {
      // Si aucun filtre prix n'a encore été défini, on crée un objet vide
      if (!filters.product_price) {
        filters.product_price = {};
      }
      filters.product_price.$lte = Number(req.query.priceMax);
      // $lte = "less than or equal" = inférieur ou égal
    }

    // ↕️ 5. TRI : par prix croissant ou décroissant
    if (req.query.sort === "price-desc") {
      sort.product_price = -1; // 📉 Du plus cher au moins cher
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1; // 📈 Du moins cher au plus cher
    }

    // 📄 6. PAGINATION : découper les résultats en pages
    const limit = Number(req.query.limit) || 10; // Combien d’annonces par page (par défaut : 10)
    const page = Number(req.query.page) || 1; // Quelle page demander (par défaut : 1)
    const skip = (page - 1) * limit; // Combien d’annonces sauter pour arriver à cette page

    // 🧪 7. REQUÊTE MongoDB
    // On interroge la base avec les critères (filtres), le tri, la pagination, etc.
    const matchedOffers = await Offer.find(filters)
      .sort(sort) // ↕️ Appliquer le tri demandé (si présent)
      .skip(skip) // ⏭ Sauter les annonces précédentes
      .limit(limit) // 📦 Limiter le nombre d’annonces renvoyées
      .populate("owner", "account"); // 👤 Ajouter les infos du propriétaire (username, avatar...)

    // 🧮 8. COMPTE TOTAL : combien d’annonces correspondent à la recherche ?
    const totalMatchingOffers = await Offer.countDocuments(filters);

    // 📤 9. ENVOI DE LA RÉPONSE
    // On envoie les résultats + le nombre total pour que le frontend sache combien il y a de pages
    res.status(200).json({
      count: totalMatchingOffers,
      matchedOffers: matchedOffers,
    });
  } catch (error) {
    // 🚨 Si une erreur survient
    res.status(400).json({ message: error.message });
  }
});

// ROUTE GET /offers/:id — Récupérer UNE annonce précise via son ID
router.get("/offers/:id", async (req, res) => {
  try {
    // 📥 On récupère l'ID depuis l’URL (ex: /offers/64db2c...abc)
    const offerId = req.params.id;

    // 🔍 On va chercher cette annonce dans la base MongoDB
    const matchedOffer = await Offer.findById(offerId).populate(
      "owner",
      "account"
    );

    // ❓ Si aucune annonce trouvée, on renvoie une erreur 404
    if (!matchedOffer) {
      return res
        .status(404)
        .json({ message: "Aucune annonce trouvée avec cet ID." });
    }

    // ✅ Sinon, on renvoie l’annonce trouvée avec les infos du propriétaire
    res.status(200).json(matchedOffer);
  } catch (error) {
    // 🚨 En cas d’erreur (ex: ID mal formé), on renvoie une erreur 400
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
