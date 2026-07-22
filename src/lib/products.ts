export type Product = {
  id: string;
  name: string;
  type: string;
  price: number; // in euros
};

export const products: Product[] = [
  {
    id: "prime",
    name: "Prime Ready",
    type: "prime",
    price: 0.50,
  },
  {
    id: "premier",
    name: "Premier Ready",
    type: "premier",
    price: 0.65,
  },
  {
    id: "premier-4-medals",
    name: "Premier Ready (4+ Medals)",
    type: "premier-4-medals",
    price: 0.92,
  },
  {
    id: "premier-10-medals",
    name: "Premier Ready (10+ Medals)",
    type: "premier-10-medals",
    price: 0.96,
  },
  {
    id: "premier-10k",
    name: "Premier Ready (10.000 Rating)",
    type: "premier-10k",
    price: 1.11,
  },
  {
    id: "premier-15k",
    name: "Premier Ready (15.000 Rating)",
    type: "premier-15k",
    price: 1.74,
  },
  {
    id: "premier-20k",
    name: "Premier Ready (20.000 Rating)",
    type: "premier-20k",
    price: 2.45,
  },
  {
    id: "premier-rare",
    name: "Premier Ready (Knife or Glove)",
    type: "premier-rare",
    price: 2.76,
  },
];
