export type Product = {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  price: number; // in euros
  cost?: number; // wholesale cost in euros
  category: string;
  popularity: number; // Higher number = more popular
  image?: string;
};

export const products: Product[] = [
  // CS2 Products
  {
    id: "prime",
    name: "Prime Ready",
    type: "prime",
    endpoint: "cs2",
    category: "cs2",
    price: 0.79,
    cost: 0.40,
    popularity: 100,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier",
    name: "Premier Ready",
    type: "premier",
    endpoint: "cs2",
    category: "cs2",
    price: 0.99,
    cost: 0.50,
    popularity: 90,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-4-medals",
    name: "Premier Ready (4+ Medals)",
    type: "premier-4-medals",
    endpoint: "cs2",
    category: "cs2",
    price: 1.49,
    cost: 0.80,
    popularity: 70,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-10-medals",
    name: "Premier Ready (10+ Medals)",
    type: "premier-10-medals",
    endpoint: "cs2",
    category: "cs2",
    price: 1.79,
    cost: 1.00,
    popularity: 50,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-inactive",
    name: "Premier Ready (Inactive 14d)",
    type: "premier-inactive",
    endpoint: "cs2",
    category: "cs2",
    price: 1.99,
    cost: 0.90,
    popularity: 65,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-10k",
    name: "Premier Ready (10.000 Rating)",
    type: "premier-10k",
    endpoint: "cs2",
    category: "cs2",
    price: 1.99,
    cost: 1.10,
    popularity: 45,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-15k",
    name: "Premier Ready (15.000 Rating)",
    type: "premier-15k",
    endpoint: "cs2",
    category: "cs2",
    price: 2.99,
    cost: 1.50,
    popularity: 40,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-20k",
    name: "Premier Ready (20.000 Rating)",
    type: "premier-20k",
    endpoint: "cs2",
    category: "cs2",
    price: 4.49,
    cost: 2.50,
    popularity: 35,
    image: "/gra-cs2.webp",
  },
  {
    id: "premier-rare",
    name: "Premier Ready (Knife or Glove)",
    type: "premier-rare",
    endpoint: "cs2",
    category: "cs2",
    price: 4.99,
    cost: 2.80,
    popularity: 30,
    image: "/gra-cs2.webp",
  },
  
  // Rust Products
  {
    id: "rust-1-99",
    name: "Rust 1-100 Hours",
    type: "1-99",
    endpoint: "rust",
    category: "rust",
    price: 1.81,
    cost: 0.90,
    popularity: 85,
    image: "/gra-rust.webp",
  },
  {
    id: "rust-100-199",
    name: "Rust 100-200 Hours",
    type: "100-199",
    endpoint: "rust",
    category: "rust",
    price: 1.97,
    cost: 1.00,
    popularity: 75,
    image: "/gra-rust.webp",
  },
  {
    id: "rust-200-499",
    name: "Rust 200-500 Hours",
    type: "200-499",
    endpoint: "rust",
    category: "rust",
    price: 2.15,
    cost: 1.10,
    popularity: 65,
    image: "/gra-rust.webp",
  },
  {
    id: "rust-500-999",
    name: "Rust 500-1000 Hours",
    type: "500-999",
    endpoint: "rust",
    category: "rust",
    price: 2.45,
    cost: 1.25,
    popularity: 55,
    image: "/gra-rust.webp",
  },
  {
    id: "rust-1000-plus",
    name: "Rust 1000+ Hours",
    type: "1000-plus",
    endpoint: "rust",
    category: "rust",
    price: 2.85,
    cost: 1.50,
    popularity: 45,
    image: "/gra-rust.webp",
  },

  // Extra Products (R6, DayZ, Battlefield)
  {
    id: "r6",
    name: "Rainbow Six Siege",
    type: "r6",
    endpoint: "extra",
    category: "extra",
    price: 1.40,
    cost: 0.70,
    popularity: 60,
    image: "/gra-rainbow-six-siege.webp",
  },
  {
    id: "dayz",
    name: "DayZ",
    type: "dayz",
    endpoint: "extra",
    category: "extra",
    price: 1.40,
    cost: 0.70,
    popularity: 60,
    image: "/gra-dayz.webp",
  },
  {
    id: "bf6",
    name: "Battlefield 6",
    type: "bf6",
    endpoint: "extra",
    category: "extra",
    price: 1.40,
    cost: 0.70,
    popularity: 60,
    image: "/gra-battlefield-6.webp",
  }
];

export function getProductImage(productId?: string, category?: string): string {
  if (!productId) return "/gra-cs2.webp";
  if (productId === "r6") return "/gra-rainbow-six-siege.webp";
  if (productId === "dayz") return "/gra-dayz.webp";
  if (productId === "bf6") return "/gra-battlefield-6.webp";
  if (category === "rust" || productId.startsWith("rust")) return "/gra-rust.webp";
  if (category === "cs2" || productId.startsWith("prime") || productId.startsWith("premier")) return "/gra-cs2.webp";
  if (category === "extra") return "/kategoria-extra.webp";
  
  // Try to find directly in products array
  const p = products.find(prod => prod.id === productId);
  if (p?.image) return p.image;

  return "/gra-cs2.webp";
}

export function getGameName(endpoint?: string, productId?: string): string {
  if (endpoint === "rust" || (productId && productId.startsWith("rust"))) return "Rust";
  if (productId === "r6") return "Rainbow Six Siege";
  if (productId === "dayz") return "DayZ";
  if (productId === "bf6") return "Battlefield 6";
  return "Counter Strike 2";
}

