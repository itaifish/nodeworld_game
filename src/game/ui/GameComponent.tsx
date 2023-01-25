import type { Session } from 'next-auth';
import type { Types } from 'phaser';
import { useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import MainScene from '../scene/MainScene';

const gameConfig: Types.Core.GameConfig = {
	width: '100%',
	height: '100%',
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	autoFocus: true,
	title: 'Nodeworld',
	scene: MainScene,
};

interface GameComponentProps {
	sessionData: Session | null;
}

export function GameComponent({ sessionData }: GameComponentProps) {
	const parentEl = useRef<HTMLDivElement>(null);
	const _game = useGame(gameConfig, parentEl);

	return (
		<>
			<div ref={parentEl} className="gameContainer" />
		</>
	);
}
