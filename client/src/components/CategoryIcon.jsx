import {
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sofa,
  UtensilsCrossed,
  WashingMachine,
  BookOpen,
  ToyBrick,
  Sparkles,
  ShoppingBasket,
  Dumbbell,
  Gem,
  Watch,
  Car,
  Gamepad2,
  Music,
  PawPrint,
  Package,
} from "lucide-react";

import { getCategoryIcon } from "../utils/constants";

const ICONS = {
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sofa,
  UtensilsCrossed,
  WashingMachine,
  BookOpen,
  ToyBrick,
  Sparkles,
  ShoppingBasket,
  Dumbbell,
  Gem,
  Watch,
  Car,
  Gamepad2,
  Music,
  PawPrint,
  Package,
};

export const getCategoryIconComponent = (category) =>
  ICONS[getCategoryIcon(category)] || Package;

export default function CategoryIcon({ category, ...props }) {
  const Icon = getCategoryIconComponent(category);
  return <Icon {...props} />;
}
