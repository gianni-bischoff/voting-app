import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash2, ExternalLink } from 'lucide-react';
import Image from "next/image";
import { motion } from "framer-motion";
import { Vote, Game } from '@/types/game';

interface GameCardProps {
  game: Game;
  user: any; // Replace 'any' with your user type
  userVotes: Record<string, number>;
  onVote: (gameId: string, score: number) => void;
  onRemove: (gameId: string) => void;
  calculateAverageVote: (game: Game) => number;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  user,
  userVotes,
  onVote,
  onRemove,
  calculateAverageVote,
}) => {
  return (
    <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
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
                  onValueChange={(value) => onVote(game.id, value[0])}
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
              <ExternalLink className="h-4 w-4 mr-2" />
              Play Game
            </Button>

            {user && user.isManager && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(game.id)}
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
  );
}; 