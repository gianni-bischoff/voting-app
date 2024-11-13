"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ThumbsUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Add interface at the top of the file
interface Game {
  id: number;
  name: string;
  votes: number[];
  averageVote: number;
}

// Mock initial data
const initialGames = [
  { id: 1, name: "Mario Kart 8", votes: [], averageVote: 0 },
  { id: 2, name: "Super Smash Bros", votes: [], averageVote: 0 },
  { id: 3, name: "Among Us", votes: [], averageVote: 0 },
];

const GameVotingApp = () => {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [newGame, setNewGame] = useState("");
  const [sortOrder, setSortOrder] = useState("none");

  // Add new game
  const handleAddGame = () => {
    if (newGame.trim()) {
      const newGameObj = {
        id: games.length + 1,
        name: newGame.trim(),
        votes: [],
        averageVote: 0
      };
      setGames([...games, newGameObj]);
      setNewGame("");
    }
  };

  // Remove game
  const handleRemoveGame = (id: number) => {
    setGames(games.filter(game => game.id !== id));
  };

  // Vote for a game
  const handleVote = (gameId: number, vote: string) => {
    setGames(games.map(game => {
      if (game.id === gameId) {
        const newVotes = [...game.votes, parseInt(vote)];
        const average = newVotes.reduce((a, b) => a + b, 0) / newVotes.length;
        return {
          ...game,
          votes: newVotes,
          averageVote: parseFloat(average.toFixed(1))
        };
      }
      return game;
    }));
  };

  // Sort games
  const handleSort = (value: string) => {
    setSortOrder(value);
    let sortedGames = [...games];
    
    switch (value) {
      case "highest":
        sortedGames.sort((a, b) => b.averageVote - a.averageVote);
        break;
      case "lowest":
        sortedGames.sort((a, b) => a.averageVote - b.averageVote);
        break;
      case "alphabetical":
        sortedGames.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sortedGames = [...initialGames];
    }
    
    setGames(sortedGames);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-20">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Game Voting System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Enter game name"
              value={newGame}
              onChange={(e) => setNewGame(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleAddGame}>
              <Plus className="mr-2 h-4 w-4" /> Add Game
            </Button>
          </div>

          <div className="mb-6">
            <Select value={sortOrder} onValueChange={handleSort}>
              <SelectTrigger>
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

          <div className="space-y-4 mt-4">
            {games.map((game) => (
              <Card key={game.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{game.name}</h3>
                    <p className="text-sm text-gray-500">
                      Average Rating: {game.averageVote || "No votes yet"}
                      {game.votes.length > 0 && ` (${game.votes.length} votes)`}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Select
                      onValueChange={(value) => handleVote(game.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Vote" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveGame(game.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameVotingApp;
