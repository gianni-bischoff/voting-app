"use client";

import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Mait Game Voting</h1>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </nav>
  );
} 