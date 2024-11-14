"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from 'next/navigation';
import { useAuth, pb } from '@/lib/auth';
import { GameCard } from '@/components/GameCard';
import { AddGameDialog } from '@/components/AddGameDialog';
import { Game, Vote } from '@/types/game';
import { RotateCw } from "lucide-react";

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

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (user) {
      await Promise.all([loadGames(), loadUserVotes()]);
    } else {
      await loadGames();
      setUserVotes({}); // Reset votes when user logs out
    }
  };

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

  const loadGames = async () => {
    try {
      const records = await pb.collection('games').getFullList({
        requestKey: null,
        expand: 'votes'
      });
      
      const typedGames = records.map(record => ({
        id: record.id,
        name: record.name,
        description: record.description,
        url: record.url,
        picture_url: record.picture_url,
        submitted_by: record.submitted_by,
        isActive: record.isActive || false,
        expand: {
          votes: record.expand?.votes || []
        }
      }));
      
      let sortedGames = [...typedGames];
      applySortOrder(sortedGames, sortOrder);
      setGames(sortedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

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
          isActive: false,
          ...data
        }]);
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

  const handleRemoveGame = async (id: string) => {
    try {
      await pb.collection('games').delete(id);
      setGames(games.filter(game => game.id !== id));
    } catch (error) {
      console.error('Error removing game:', error);
    }
  };

  const handleVote = async (gameId: string, score: number) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    setUserVotes(prev => ({
      ...prev,
      [gameId]: score
    }));

    if (voteTimeout) {
      clearTimeout(voteTimeout);
    }

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
    }, 1000);

    setVoteTimeout(timeout);
  };

  const handleSort = (value: string) => {
    setSortOrder(value);
    let sortedGames = [...games];
    applySortOrder(sortedGames, value);
    setGames(sortedGames);
  };

  const applySortOrder = (games: Game[], order: string) => {
    games.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });

    const activeGames = games.filter(g => g.isActive);
    const inactiveGames = games.filter(g => !g.isActive);

    const sortGames = (gamesArray: Game[]) => {
      switch (order) {
        case "highest":
          gamesArray.sort((a, b) => calculateAverageVote(b) - calculateAverageVote(a));
          break;
        case "lowest":
          gamesArray.sort((a, b) => calculateAverageVote(a) - calculateAverageVote(b));
          break;
        case "alphabetical":
          gamesArray.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
    };

    sortGames(activeGames);
    sortGames(inactiveGames);

    games.splice(0, games.length, ...activeGames, ...inactiveGames);
  };

  const calculateAverageVote = (game: Game) => {
    if (!game.expand?.votes || game.expand.votes.length === 0) return 0;
    const sum = game.expand.votes.reduce((acc, vote) => acc + vote.score, 0);
    return parseFloat((sum / game.expand.votes.length).toFixed(1));
  };

  const handleToggleActive = async (gameId: string, isActive: boolean) => {
    try {
      await pb.collection('games').update(gameId, {
        isActive: isActive
      });
      setGames(games.map(game => 
        game.id === gameId ? { ...game, isActive } : game
      ));
      handleSort(sortOrder);
      await loadGames();
    } catch (error) {
      console.error('Error toggling game active state:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="h-16 mt-8 flex items-center justify-between">
        <div>
          {user && user.isManager && (
            <AddGameDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              gameData={newGameData}
              onGameDataChange={setNewGameData}
              onAddGame={handleAddGame}
            />
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              loadGames();
              handleSort(sortOrder);
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
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

      <div className="mt-3 grid grid-cols-1 gap-6">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            user={user}
            userVotes={userVotes}
            onVote={handleVote}
            onRemove={handleRemoveGame}
            onToggleActive={handleToggleActive}
            calculateAverageVote={calculateAverageVote}
          />
        ))}
      </div>
    </div>
  );
};

export default GameVotingApp;
