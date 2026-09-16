import { ImageResponse } from "next/og";
import { AppIconArt } from "@/lib/app-icon";

export async function GET() {
  return new ImageResponse(<AppIconArt />, {
    width: 512,
    height: 512,
  });
}
