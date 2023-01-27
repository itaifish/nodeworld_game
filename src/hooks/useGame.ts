import { useState, useEffect } from 'react';
import type { Types } from 'phaser';
import NodeworldGame from '../game/nodeworldGame';
import GameSyncManager from '../game/manager/GameSyncManager';

export function useGame(
	config: Types.Core.GameConfig,
	containerRef: React.RefObject<HTMLDivElement>,
): NodeworldGame | undefined {
	const [game, setGame] = useState<NodeworldGame>();
	const [gameSyncManager, _] = useState<GameSyncManager>(new GameSyncManager());
	useEffect(() => {
		if (!game && containerRef.current) {
			setGame((oldGame) => {
				if (!oldGame && containerRef.current) {
					return new NodeworldGame({ ...config, parent: containerRef.current }, gameSyncManager);
				} else {
					return oldGame;
				}
			});
		}
		return () => {
			game?.destroy(true);
		};
	}, [config, containerRef, game, gameSyncManager]);

	return game;
}
