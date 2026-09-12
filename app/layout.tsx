import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "WORLD NOW | 실시간 자연재해",
  description: "전 세계 지진, 산불, 폭풍, 화산, 홍수를 한눈에 보는 실시간 자연재해 상황판",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
