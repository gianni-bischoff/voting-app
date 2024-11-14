"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ThumbsUp, ExternalLink } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useAuth, pb } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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

const GameVotingApp = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [newGameData, setNewGameData] = useState({
    name: "",
    description: "",
    url: "",
    picture_url: "",
  });
  const [sortOrder, setSortOrder] = useState("none");
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [voteTimeout, setVoteTimeout] = useState<NodeJS.Timeout | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Update useEffect with proper dependency array
  useEffect(() => {
    loadInitialData();
  }, [user]);

  // Move the loading logic to a separate function
  const loadInitialData = async () => {
    if (user) {
      await Promise.all([loadGames(), loadUserVotes()]);
    } else {
      await loadGames();
      setUserVotes({}); // Reset votes when user logs out
    }
  };

  // Add function to load user votes
  const loadUserVotes = async () => {
    if (!user) return;
    
    try {
      const userVoteRecords = await pb.collection('votes').getFullList({
        requestKey: null,
        filter: `user = "${user.id}"`,
      });
      
      const votesMap = userVoteRecords.reduce((acc, vote) => ({
        ...acc,
        [vote.game]: vote.score
      }), {});
      
      setUserVotes(votesMap);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

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

  // Replace handleAddGame with this new version
  const handleAddGame = async () => {
    if (newGameData.name.trim()) {
      try {
        const data = {
          name: newGameData.name.trim(),
          description: newGameData.description,
          url: newGameData.url,
          picture_url: newGameData.picture_url,
          submitted_by: user?.id || "",
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
        // Reset form and close dialog
        setNewGameData({
          name: "",
          description: "",
          url: "",
          picture_url: "",
        });
        setDialogOpen(false);
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

  // Helper function to calculate average vote
  const calculateAverageVote = (game: Game) => {
    if (!game.expand?.votes || game.expand.votes.length === 0) return 0;
    const sum = game.expand.votes.reduce((acc, vote) => acc + vote.score, 0);
    return parseFloat((sum / game.expand.votes.length).toFixed(1));
  };

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Manager controls and sort in same row */}
      <div className="h-16 mt-8 flex items-center justify-between">
        {/* Manager controls on left */}
        <div>
          {user && user.isManager && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Game
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Game</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newGameData.name}
                      onChange={(e) => setNewGameData(prev => ({...prev, name: e.target.value}))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={newGameData.description}
                      onChange={(e) => setNewGameData(prev => ({...prev, description: e.target.value}))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="url" className="text-right">
                      URL
                    </Label>
                    <Input
                      id="url"
                      value={newGameData.url}
                      onChange={(e) => setNewGameData(prev => ({...prev, url: e.target.value}))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right">
                      Picture URL
                    </Label>
                    <Input
                      id="picture"
                      value={newGameData.picture_url}
                      onChange={(e) => setNewGameData(prev => ({...prev, picture_url: e.target.value}))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddGame}>Add Game</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Sort controls on right */}
        <div>
          <Select value={sortOrder} onValueChange={handleSort}>
            <SelectTrigger className="w-[180px]">
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
      </div>

      {/* Games grid */}
      <div className="mt-3 grid grid-cols-1 gap-6">
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
                          {userVotes[game.id] !== undefined ? 
                            `${userVotes[game.id]} (Avg. ${calculateAverageVote(game)})` : 
                            `Avg. ${calculateAverageVote(game)}`
                          }
                        </motion.span>
                      </div>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[userVotes[game.id] !== undefined ? userVotes[game.id] : 0]}
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

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(game.url, '_blank')}
                    className="self-end"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameVotingApp;
