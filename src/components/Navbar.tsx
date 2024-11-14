"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function Navbar() {
  const { user, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {/* Your existing navbar content */}
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {user ? (
            <div className="flex items-center gap-4">
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span>Welcome, {user.username}!</span>
              <Button onClick={logout} variant="outline">Logout</Button>
            </div>
          ) : (
            <Button onClick={login}>
              Login with Discord
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
} 