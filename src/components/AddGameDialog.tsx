import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AddGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameData: {
    id?: string;
    name: string;
    description: string;
    url: string;
    picture_url: string;
  };
  onGameDataChange: (data: any) => void;
  onSubmit: () => void;
  mode: 'add' | 'edit';
}

export const AddGameDialog: React.FC<AddGameDialogProps> = ({
  open,
  onOpenChange,
  gameData,
  onGameDataChange,
  onSubmit,
  mode,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Game' : 'Edit Game'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={gameData.name}
              onChange={(e) => onGameDataChange({ ...gameData, name: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={gameData.description}
              onChange={(e) => onGameDataChange({ ...gameData, description: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              URL
            </Label>
            <Input
              id="url"
              value={gameData.url}
              onChange={(e) => onGameDataChange({ ...gameData, url: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="picture" className="text-right">
              Picture URL
            </Label>
            <Input
              id="picture"
              value={gameData.picture_url}
              onChange={(e) => onGameDataChange({ ...gameData, picture_url: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit}>
            {mode === 'add' ? 'Add Game' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 