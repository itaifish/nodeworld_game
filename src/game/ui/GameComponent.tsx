import type { Session } from 'next-auth';
import type { Types } from 'phaser';
import { useRef } from 'react';
import { useGame } from '../../hooks/useGame';

const gameConfig: Types.Core.GameConfig = {
	width: '100%',
	height: '80%',
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		resizeInterval: 100,
	},
	autoFocus: true,
	title: 'Nodeworld',
};

interface GameComponentProps {
	sessionData: Session | null;
}

export function GameComponent({ sessionData }: GameComponentProps) {
	const parentEl = useRef<HTMLDivElement>(null);
	useGame(gameConfig, parentEl);

	return (
		<>
			<div ref={parentEl} className="gameContainer" />
		</>
	);
}
