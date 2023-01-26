import { useState, useEffect } from 'react';
import type { Types } from 'phaser';
import type { Game } from 'phaser';
import NodeworldGame from '../game/nodeworldGame';
import GameSyncManager from '../game/manager/GameSyncManager';

export function useGame(
	config: Types.Core.GameConfig,
	containerRef: React.RefObject<HTMLDivElement>,
): Game | undefined {
	const [game, setGame] = useState<Game>();
	useEffect(() => {
		if (!game && containerRef.current) {
			setGame((oldGame) => {
				if (!oldGame && containerRef.current) {
					return new NodeworldGame({ ...config, parent: containerRef.current }, new GameSyncManager());
				} else {
					return oldGame;
				}
			});
		}
		return () => {
			game?.destroy(true);
		};
	}, [config, containerRef, game]);

	return game;
}
