export const ORDER_STATUSES = [
  "Pending",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-views", label: "Most popular" },
];

export const CATEGORY_ICON_MAP = {
  electronics: "Smartphone",
  mobiles: "Smartphone",
  phones: "Smartphone",
  laptops: "Laptop",
  computers: "Laptop",
  fashion: "Shirt",
  clothing: "Shirt",
  apparel: "Shirt",
  footwear: "Footprints",
  shoes: "Footprints",
  home: "Sofa",
  furniture: "Sofa",
  kitchen: "UtensilsCrossed",
  appliances: "WashingMachine",
  books: "BookOpen",
  toys: "ToyBrick",
  beauty: "Sparkles",
  grocery: "ShoppingBasket",
  sports: "Dumbbell",
  jewelry: "Gem",
  jewellery: "Gem",
  watches: "Watch",
  automotive: "Car",
  gaming: "Gamepad2",
  music: "Music",
  pets: "PawPrint",
};

export const getCategoryIcon = (category = "") =>
  CATEGORY_ICON_MAP[category.trim().toLowerCase()] || "Package";
