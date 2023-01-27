import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { GameComponent } from '../game/ui/GameComponent';
import styles from '../pages/index.module.css';
import background from '../../public/endless-constellation.svg';
import { useMemo } from 'react';

const Play = () => {
	const { data: sessionData } = useSession();
	const game = useMemo(() => <GameComponent sessionData={sessionData} />, [sessionData]);
	let gameJSX;
	if (sessionData != null) {
		gameJSX = game;
	} else {
		gameJSX = (
			<>
				<div className={styles.authContainer}>
					<h2 className={styles.title}>
						<span className={styles.pinkSpan}>You aren{"'"}t logged in!</span>
					</h2>
					<h2 className={styles.showcaseContainer}>
						Try logging in{' '}
						<Link href="/" style={{ color: 'blue' }}>
							here
						</Link>
					</h2>
				</div>
			</>
		);
	}

	return (
		<main className={styles.main} style={{ backgroundImage: `url(${background.src})` }}>
			<div className={styles.container} style={{ gap: '0rem', padding: '0rem 0rem' }}>
				{gameJSX}
			</div>
		</main>
	);
};

export default Play;
