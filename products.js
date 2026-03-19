

const STORE_CONFIG = {
  name: "Bhutan Hype",
  tagline: "Wear the Legend",
  currency: "Nu.",
  whatsappNumber: "97517271095",   // ← CHANGE THIS
  adminPassword: "BhutanHYPE30#",         // ← CHANGE THIS
  freeShippingThreshold: 2000,
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Real Madrid Home '24",
    team: "Real Madrid", league: "La Liga",
    description: "The iconic all-white home kit worn by Los Blancos in the 2024/25 UCL campaign. Premium player-grade fabric with moisture-wicking technology.",
    price: 1800, discount: 15,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "https://sl.bing.net/jSFVFkZ90dU",
    inStock: true, featured: true, isNew: false,
    badge: "Best Seller",
    playerName: "", playerNumber: "",
    tags: ["white", "home", "champions league"],
  },
  {
    id: 2,
    name: "FC Barcelona Away '24",
    team: "FC Barcelona", league: "La Liga",
    description: "Barcelona's striking away strip. Slim fit, breathable fabric with authentic Catalan identity.",
    price: 1800, discount: 0,
    sizes: ["S", "M", "L", "XL"],
    image: "https://sl.bing.net/cHhFNyX3OtU",
    inStock: true, featured: true, isNew: true,
    badge: "New",
    playerName: "Yamal", playerNumber: "19",
    tags: ["away"],
  },
  {
    id: 3,
    name: "Man United Home '24",
    team: "Manchester United", league: "Premier League",
    description: "The legendary Red Devils home shirt. Classic theatre of dreams red.",
    price: 2000, discount: 20,
    sizes: ["M", "L", "XL", "XXL"],
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=85",
    inStock: true, featured: false, isNew: false,
    badge: "Sale",
    playerName: "", playerNumber: "",
    tags: ["red", "home"],
  },
  {
    id: 4,
    name: "Manchester City Third",
    team: "Manchester City", league: "Premier League",
    description: "City's bold third-choice kit. Limited run — collector's piece.",
    price: 2000, discount: 0,
    sizes: ["S", "M", "L"],
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=85",
    inStock: false, featured: false, isNew: false,
    badge: "",
    playerName: "Haaland", playerNumber: "9",
    tags: ["third"],
  },
  {
    id: 5,
    name: "PSG Home Jersey '24",
    team: "PSG", league: "Ligue 1",
    description: "Parisian elegance meets football ferocity.",
    price: 1900, discount: 10,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=85",
    inStock: true, featured: true, isNew: true,
    badge: "New",
    playerName: "Mbappé", playerNumber: "7",
    tags: ["paris", "home"],
  },
  {
    id: 6,
    name: "Brazil National '24",
    team: "Brazil", league: "National",
    description: "The most recognisable shirt in world football. Wear the most successful nation in World Cup history.",
    price: 1700, discount: 0,
    sizes: ["M", "L", "XL"],
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=85",
    inStock: true, featured: true, isNew: false,
    badge: "Best Seller",
    playerName: "Vinicius Jr", playerNumber: "7",
    tags: ["yellow", "national", "world cup"],
  },
  {
    id: 7,
    name: "Argentina WC Edition",
    team: "Argentina", league: "National",
    description: "The World Champion's jersey. Worn during the historic 2022 Qatar World Cup triumph.",
    price: 2200, discount: 5,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=85",
    inStock: true, featured: true, isNew: true,
    badge: "New",
    playerName: "Messi", playerNumber: "10",
    tags: ["national", "world cup", "champions"],
  },
  {
    id: 8,
    name: "Chelsea Away '24",
    team: "Chelsea", league: "Premier League",
    description: "The Blues' away kit for the current season.",
    price: 1850, discount: 25,
    sizes: ["S", "M", "L"],
    image: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=85",
    inStock: false, featured: false, isNew: false,
    badge: "",
    playerName: "Palmer", playerNumber: "20",
    tags: ["away", "blue"],
  },
  {
    id: 9,
    name: "Bayern Munich Home",
    team: "Bayern Munich", league: "Bundesliga",
    description: "Der Rekordmeister's home shirt. Classic red, unmistakable.",
    price: 1950, discount: 0,
    sizes: ["M", "L", "XL", "XXL"],
    image: "https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800&q=85",
    inStock: true, featured: false, isNew: false,
    badge: "",
    playerName: "Kane", playerNumber: "9",
    tags: ["red", "home", "bundesliga"],
  },
];

function getProducts() {
  try {
    const stored = localStorage.getItem("kitking_products");
    if (stored) return JSON.parse(stored);
  } catch (e) { }
  return DEFAULT_PRODUCTS;
}
function saveProducts(products) {
  try { localStorage.setItem("kitking_products", JSON.stringify(products)); } catch (e) { }
}
