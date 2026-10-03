import { cardSize, renderCard } from "@/lib/og";

export const alt = "Portfolio preview card";
export const size = cardSize;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image() {
  return renderCard();
}
