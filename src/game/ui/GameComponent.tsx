import type { Session } from 'next-auth';
import Phaser from 'phaser';
import BoardPlugin from 'phaser3-rex-plugins/plugins/board-plugin';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import CloudyMountains from '../resources/images/backgrounds/loading-screens/Cloudy Mountains.png';
import DustyMoon from '../resources/images/backgrounds/loading-screens/Dusty Moon.png';
import GlowingSea from '../resources/images/backgrounds/loading-screens/Glowing Sea.png';
import HiddenDesert from '../resources/images/backgrounds/loading-screens/Hidden Desert.png';
import MistyRocks from '../resources/images/backgrounds/loading-screens/Misty Rocks.png';
import StarryPeaks from '../resources/images/backgrounds/loading-screens/Starry Peaks.png';
import Image from 'next/image';
import { getRandomElementInList } from '../logic/general/math';
import styles from '../../pages/index.module.css';

const gameConfig: Phaser.Types.Core.GameConfig = {
	width: '100%',
	height: '100%',
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
		resizeInterval: 100,
	},
	autoFocus: true,
	title: 'Nodeworld',
	plugins: {
		scene: [
			{
				key: 'rexBoard',
				plugin: BoardPlugin,
				start: true,
				mapping: 'rexBoard',
			},
		],
	},
};

interface GameComponentProps {
	sessionData: Session | null;
}

const loadingBackgrounds = [CloudyMountains, DustyMoon, GlowingSea, HiddenDesert, MistyRocks, StarryPeaks];

export function GameComponent({}: GameComponentProps) {
	const parentEl = useRef<HTMLDivElement>(null);
	const [loading, setLoading] = useState(true);
	const game = useGame(gameConfig, parentEl);
	useEffect(() => {
		if (game == null || !loading) {
			return;
		}
		game.gameSyncManager.updateBaseGameState().then(() => {
			setLoading(false);
		});
	}, [game, loading]);

	const loadingJSX = (
		<>
			<h2 className={styles.title}>Loading</h2>
			<Image src={getRandomElementInList(loadingBackgrounds)} alt="loading image" />
		</>
	);

	return (
		<>
			{loading && loadingJSX}
			<div ref={parentEl} className="gameContainer" style={{ opacity: loading ? 0 : 1 }} />
		</>
	);
}
