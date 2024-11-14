import Image from "next/image";
import GameVoting from "@/components/GameVoting";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="font-[family-name:var(--font-geist-sans)]">
        <GameVoting />
      </div>
    </div>
  );
}
