import Badge from "./Badge";

export default function StockBadge({ stock }) {
  if (stock <= 0) {
    return <Badge variant="danger">Out of stock</Badge>;
  }

  if (stock <= 5) {
    return <Badge variant="warning">Only {stock} left</Badge>;
  }

  return <Badge variant="success">In stock</Badge>;
}
