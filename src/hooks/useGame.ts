import { useState, useEffect } from 'react';
import type { Types } from 'phaser';
import { Game } from 'phaser';

export function useGame(
	config: Types.Core.GameConfig,
	containerRef: React.RefObject<HTMLDivElement>,
): Game | undefined {
	const [game, setGame] = useState<Game>();
	useEffect(() => {
		if (!game && containerRef.current) {
			setGame((oldGame) => {
				if (!oldGame && containerRef.current) {
					return new Game({ ...config, parent: containerRef.current });
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
