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
import { getRandomElementInList } from '../logic/general/math';
import styles from '../../pages/index.module.css';
import { log } from '../../utility/logger';
import GameSyncManager from '../manager/GameSyncManager';

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
		game.gameSyncManager.once(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => {
			setLoading(false);
		});
	}, [game, loading]);

	const loadingJSX = (
		<div
			className="TEST"
			style={{
				backgroundImage: `url("${getRandomElementInList(loadingBackgrounds).src}")`,
				backgroundPosition: 'center' /* Center the image */,
				backgroundRepeat: 'no-repeat' /* Do not repeat the image */,
				backgroundSize: 'cover' /* Resize the background image to cover the entire container */,
				width: '1600px',
				height: '900px',
			}}
		>
			<h2
				className={styles.title}
				style={{
					margin: 0,
					position: 'absolute',
					top: '50%',
					left: '40%',
					MozTransformOrigin: 'translateY(-50%)',
					transform: 'translateY(-50%)',
					textAlign: 'center',
				}}
			>
				Loading
			</h2>
		</div>
	);

	return (
		<>
			{loading && loadingJSX}
			<div ref={parentEl} className="gameContainer" style={{ opacity: loading ? 0 : 1 }} />
		</>
	);
}
