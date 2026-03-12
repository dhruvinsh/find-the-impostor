"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { GameState, TranslationFunction } from "@/src/types/game";
import { ArrowLeft, Users, Plus, Minus, X, Edit3, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface LocalPlayer {
  id: number;
  name: string;
}

interface MobilePlayerManagementProps {
  onBack: () => void;
  gameState: GameState;
  playerNames: string[];
  setPlayerCount: (count: number, t: TranslationFunction) => void;
  setPlayerName: (index: number, name: string) => void;
  t: TranslationFunction;
}

export default function MobilePlayerManagement({
  onBack,
  gameState,
  playerNames,
  setPlayerCount,
  setPlayerName,
  t,
}: MobilePlayerManagementProps) {
  const [localPlayers, setLocalPlayers] = useState<LocalPlayer[]>(() =>
    Array.from({ length: gameState.totalPlayers }, (_, i) => ({
      id: i + 1,
      name: playerNames[i] || `${t("player")} ${i + 1}`,
    })),
  );
  const nextIdRef = useRef(gameState.totalPlayers + 1);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  // Auto-save changes
  useEffect(() => {
    setPlayerCount(localPlayers.length, t);
    localPlayers.forEach((player, index) => {
      setPlayerName(index, player.name);
    });
  }, [localPlayers, setPlayerCount, setPlayerName, t]);

  const addPlayer = () => {
    if (newPlayerName.trim() && localPlayers.length < 20) {
      setLocalPlayers([
        ...localPlayers,
        { id: nextIdRef.current++, name: newPlayerName.trim() },
      ]);
      setNewPlayerName("");
      setShowAddInput(false);
    }
  };

  const removePlayer = (id: number) => {
    const index = localPlayers.findIndex(p => p.id === id);
    if (index < 3) return;
    if (editingId === id) {
      setEditingId(null);
      setEditingName("");
    }
    setLocalPlayers(prev => prev.filter(p => p.id !== id));
  };

  const startEditing = (id: number) => {
    const player = localPlayers.find(p => p.id === id);
    if (!player) return;
    setEditingId(id);
    setEditingName(player.name);
  };

  const saveEdit = () => {
    if (editingName.trim() && editingId !== null) {
      setLocalPlayers(prev =>
        prev.map(p =>
          p.id === editingId ? { ...p, name: editingName.trim() } : p,
        ),
      );
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const increasePlayerCount = () => {
    if (localPlayers.length < 20) {
      setLocalPlayers(prev => [
        ...prev,
        { id: nextIdRef.current++, name: `${t("player")} ${prev.length + 1}` },
      ]);
    }
  };

  const decreasePlayerCount = () => {
    if (localPlayers.length > 3) {
      setLocalPlayers(prev => {
        const removed = prev[prev.length - 1];
        if (editingId === removed.id) {
          setEditingId(null);
          setEditingName("");
        }
        return prev.slice(0, -1);
      });
    }
  };

  return (
    <div className="min-h-dvh">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="absolute top-6 left-2 z-10"
      >
        <ArrowLeft className="size-6" />
      </Button>
      <div className="container mx-auto space-y-8 px-4 py-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white">{t("players")}</h1>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {t("players")}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={decreasePlayerCount}
                    disabled={localPlayers.length <= 3}
                    className="size-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <Minus className="size-5" />
                  </Button>
                  <span className="w-6 text-center text-xl font-bold text-white">
                    {localPlayers.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={increasePlayerCount}
                    disabled={localPlayers.length >= 20}
                    className="size-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <Plus className="size-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {localPlayers.map((player, index) => (
              <div key={player.id} className="w-full">
                <Card className="rounded-3xl p-0">
                  <CardContent className="p-0">
                    {editingId === player.id ? (
                      <div className="m-4 flex items-center gap-3">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onBlur={saveEdit}
                          className="ocus-visible:outline-none h-10 flex-1 bg-transparent text-white focus-visible:ring-2 focus-visible:ring-blue-500"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onMouseDown={e => e.preventDefault()} // Prevents input blur on mousedown - ensures onClick executes before onBlur triggers saveEdit
                            onClick={saveEdit}
                            className="size-9 rounded-xl text-green-400 hover:bg-green-500/10"
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onMouseDown={e => e.preventDefault()} // Prevents input blur on mousedown - ensures onClick executes before onBlur triggers saveEdit
                            onClick={cancelEdit}
                            className="size-9 rounded-xl text-gray-400 hover:bg-gray-500/10"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-between px-4 py-5"
                        onClick={() => startEditing(player.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-blue-400"></div>

                          <span className="font-medium text-white">
                            {player.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-400">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-blue-400 hover:bg-blue-500/10"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          {index >= 3 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                removePlayer(player.id);
                              }}
                              className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-500/10"
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div>
            {showAddInput ? (
              <div>
                <Card className="rounded-3xl p-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-1">
                      <Input
                        placeholder={t("player")}
                        value={newPlayerName}
                        onChange={e => setNewPlayerName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") addPlayer();
                          if (e.key === "Escape") {
                            setShowAddInput(false);
                            setNewPlayerName("");
                          }
                        }}
                        className="ocus-visible:outline-none h-10 flex-1 bg-transparent text-white focus-visible:ring-2 focus-visible:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={addPlayer}
                          disabled={
                            !newPlayerName.trim() || localPlayers.length >= 20
                          }
                          className="size-9 rounded-xl text-green-400 hover:bg-green-500/10"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowAddInput(false);
                            setNewPlayerName("");
                          }}
                          className="size-9 rounded-xl text-gray-400 hover:bg-gray-500/10"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Button
                onClick={() => setShowAddInput(true)}
                disabled={localPlayers.length >= 20}
                className="h-14 w-full bg-white text-lg font-semibold text-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
              >
                <Plus className="mr-3 h-5 w-5" />
                {t("addPlayer") || "Add Player"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
