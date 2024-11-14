"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ThumbsUp } from 'lucide-react';
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion";
import PocketBase from 'pocketbase';
import { useRouter } from 'next/navigation';

// Initialize PocketBase at the top of the file (outside component)
const pb = new PocketBase('http://127.0.0.1:8090'); // e.g., 'http://127.0.0.1:8090'

// Add interfaces
interface Vote {
  id: string;
  user: string;
  game: string;
  score: number;
}

interface Game {
  id: string;
  name: string;
  description: string;
  url: string;
  picture_url: string;
  submitted_by: string;
  expand?: {
    votes: Vote[];
  };
}

export interface DiscordMetaData {
    accent_color: any
    avatar: string
    banner: string
    banner_color: any
    clan: any
    discriminator: string
    email: string
    flags: number
    global_name: string
    id: string
    locale: string
    mfa_enabled: boolean
    premium_type: number
    public_flags: number
    username: string
    verified: boolean
  }

interface AuthUser {
  id: string;
  username: string;
  avatarUrl?: string;
  isManager: boolean;
}

const GameVotingApp = () => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [newGame, setNewGame] = useState("");
  const [sortOrder, setSortOrder] = useState("none");
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [voteTimeout, setVoteTimeout] = useState<NodeJS.Timeout | null>(null);

  // Add useEffect to fetch games
  useEffect(() => {
    loadGames();
  }, []);

  // Load games from PocketBase
  const loadGames = async () => {
    try {
      // Get games with vote count
      const records = await pb.collection('games').getFullList({
        requestKey: null,
        expand: 'votes'
      });

      console.log(records)
      
      // Map votes to their respective games
      const typedGames = records.map(record => ({
        id: record.id,
        name: record.name,
        description: record.description,
        url: record.url,
        picture_url: record.picture_url,
        submitted_by: record.submitted_by,
        expand: {
          votes: record.expand?.votes || []
        }
      }));
      
      // Apply sort order...
      let sortedGames = [...typedGames];
      switch (sortOrder) {
        case "highest":
          sortedGames.sort((a, b) => calculateAverageVote(b) - calculateAverageVote(a));
          break;
        case "lowest":
          sortedGames.sort((a, b) => calculateAverageVote(a) - calculateAverageVote(b));
          break;
        case "alphabetical":
          sortedGames.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      
      setGames(sortedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  // Add new game
  const handleAddGame = async () => {
    if (newGame.trim()) {
      try {
        const data = {
          name: newGame.trim(),
          description: "",
          url: "",
          picture_url: "",
          submitted_by: "",
          votes: [],
          averageVote: 0
        };
        
        const record = await pb.collection('games').create(data, {
          requestKey: null
        });
        setGames([...games, {
          id: record.id,
          ...data
        }]);
        setNewGame("");
      } catch (error) {
        console.error('Error adding game:', error);
      }
    }
  };

  // Remove game
  const handleRemoveGame = async (id: string) => {
    try {
      await pb.collection('games').delete(id);
      setGames(games.filter(game => game.id !== id));
    } catch (error) {
      console.error('Error removing game:', error);
    }
  };

  // Vote for a game
  const handleVote = async (gameId: string, score: number) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    // Update local state immediately for smooth UI
    setUserVotes(prev => ({
      ...prev,
      [gameId]: score
    }));

    // Clear any existing timeout
    if (voteTimeout) {
      clearTimeout(voteTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        const existingVote = await pb.collection('votes').getFirstListItem(`user = "${user.id}" && game = "${gameId}"`).catch(() => null);

        if (existingVote) {
          let voteObject = await pb.collection('votes').update(existingVote.id, { score });
          await pb.collection('games').update(gameId, {
            "votes+": voteObject.id
          });
        } else {
          await pb.collection('votes').create({
            user: user.id,
            game: gameId,
            score
          });
        }


        await loadGames();
      } catch (error) {
        console.error('Error updating vote:', error);
      }
    }, 1000); // 1 second delay

    setVoteTimeout(timeout);
  };

  // Sort games
  const handleSort = (value: string) => {
    setSortOrder(value);
    let sortedGames = [...games];
    
    switch (value) {
      case "highest":
        sortedGames.sort((a, b) => calculateAverageVote(b) - calculateAverageVote(a));
        break;
      case "lowest":
        sortedGames.sort((a, b) => calculateAverageVote(a) - calculateAverageVote(b));
        break;
      case "alphabetical":
        sortedGames.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sortedGames = [...games];
    }
    
    setGames(sortedGames);
  };

  // Add authentication check
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (pb.authStore.isValid) {
      setUser({
        id: pb.authStore.model?.id,
        username: pb.authStore.model?.name,
        avatarUrl: pb.authStore.model?.avatarUrl,
        isManager: pb.authStore.model?.isManager || false
      });
    }
  };

  const login = async () => {
    try {
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'discord',
        scopes: ['identify', 'email'],
      });
      
      if (authData.record) {
        let userData: DiscordMetaData = authData.meta?.rawUser as DiscordMetaData;
        const updatedUser = await pb.collection('users').update(authData.record.id, {
          name: userData.global_name,
          avatarUrl: authData.meta?.avatarUrl
        });
        setUser({
          id: authData.record.id,
          username: updatedUser.name,
          avatarUrl: authData.record.avatarUrl,
          isManager: updatedUser.isManager || false
        });
      } else {
        console.error('No user record in auth response');
        alert('Login failed: No user record found');
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        alert(`Login failed: ${error.message}`);
      } else {
        alert('Login failed. Please check console for details.');
      }
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  // Helper function to calculate average vote
  const calculateAverageVote = (game: Game) => {
    if (!game.expand?.votes || game.expand.votes.length === 0) return 0;
    const sum = game.expand.votes.reduce((acc, vote) => acc + vote.score, 0);
    return parseFloat((sum / game.expand.votes.length).toFixed(1));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      {/* Add auth buttons */}
      <div className="flex justify-end mb-4">
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

      {/* Only show game management for logged-in users */}
      {user && user.isManager && (
        <div className="flex gap-4 items-center mb-8">
          <Input
            placeholder="Enter game name"
            value={newGame}
            onChange={(e) => setNewGame(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={handleAddGame}>
            <Plus className="mr-2 h-4 w-4" /> Add Game
          </Button>
          <Select value={sortOrder} onValueChange={handleSort}>
            <SelectTrigger className="w-[180px] ml-auto">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex h-[200px]">
              <div className="relative w-1/2 overflow-hidden group">
                <Image
                  src={game.picture_url}
                  alt={game.name}
                  fill
                  className="object-cover brightness-75 transition-all duration-300 group-hover:brightness-100 group-hover:scale-105 transform-origin-center"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                    {game.name}
                  </h3>
                </div>
              </div>

              <div className="w-1/2 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {user ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Rating</span>
                        <motion.span 
                          key={game.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
                          className="text-lg font-bold"
                        >
                          {userVotes[game.id] ? 
                            `${userVotes[game.id]} (Avg. ${calculateAverageVote(game)})` : 
                            `Avg. ${calculateAverageVote(game)}`
                          }
                        </motion.span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[userVotes[game.id] || 5]}
                        onValueChange={(value) => handleVote(game.id, value[0])}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500">
                        {game.expand?.votes?.length || 0} vote{(game.expand?.votes?.length || 0) !== 1 && 's'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Login to vote</p>
                  )}
                </div>

                {user && user.isManager && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveGame(game.id)}
                    className="self-end"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Game
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameVotingApp;
