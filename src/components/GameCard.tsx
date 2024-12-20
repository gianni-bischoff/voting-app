import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash2, ExternalLink, ChevronDown, Pencil } from 'lucide-react';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Game } from '@/types/game';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GameCardProps {
  game: Game;
  user: any;
  userVotes: Record<string, number>;
  onVote: (gameId: string, score: number) => void;
  onRemove: (gameId: string) => void;
  onToggleActive?: (gameId: string, isActive: boolean) => void;
  calculateAverageVote: (game: Game) => number;
  onEdit?: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  user,
  userVotes,
  onVote,
  onRemove,
  onToggleActive,
  calculateAverageVote,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <Card className={`p-0 overflow-hidden transition-all ${
        game.isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-lg'
      }`}>
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-1/2 h-[200px] overflow-hidden group">
              <Image
                src={game.picture_url}
                alt={game.name}
                fill
                className="object-cover brightness-75 transition-all duration-300 group-hover:brightness-100 group-hover:scale-105 transform-origin-center"
              />
              {game.isActive && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-semibold z-10">
                  Active
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg text-center px-4">
                  {game.name}
                </h3>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col justify-between">
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
                        className="text-base md:text-lg font-bold"
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

              <div className="flex flex-wrap gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(game.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>

                {user && user.isManager && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(game.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant={game.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onToggleActive?.(game.id, !game.isActive)}
                    >
                      {game.isActive ? "Active" : "Inactive"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Remove Game</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {game.name} and remove all associated votes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemove(game.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Game
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 md:p-6 border-t">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{game.description}</p>
                    </div>
                    
                    <div className="w-full md:w-64 border-t md:border-l md:border-t-0 pt-4 md:pt-0 md:pl-6">
                      <h4 className="font-semibold mb-3">Votes</h4>
                      <div className="space-y-3">
                        {game.expand?.votes?.map((vote: Vote) => (
                          <div key={vote.id} className="flex items-center gap-3">
                            <div className="relative w-8 h-8">
                              <Image
                                src={vote.expand?.user?.avatarUrl || '/default-avatar.png'}
                                alt={vote.expand?.user?.name || 'User'}
                                fill
                                className="rounded-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {vote.expand?.user?.name || 'Anonymous'}
                              </p>
                            </div>
                            <div className="text-sm font-semibold">
                              {vote.score}
                            </div>
                          </div>
                        ))}
                        {(!game.expand?.votes || game.expand.votes.length === 0) && (
                          <p className="text-sm text-gray-500 italic">No votes yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 flex items-center justify-center py-2 bg-background shadow-md rounded-full"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </Button>
    </div>
  );
}; 