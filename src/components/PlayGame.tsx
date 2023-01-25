import { useSession } from 'next-auth/react';
import Image from 'next/image';
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
						<span className={styles.pinkSpan}>Loading Session Data</span>
					</h2>
					<h2 className={styles.showcaseContainer}>
						Taking a while? Try logging in again{' '}
						<Link href="/" style={{ color: 'blue' }}>
							here
						</Link>
					</h2>
					<Image src="/loadingIcon.svg" height={100} width={100} alt={'Loading Icon'} />
				</div>
			</>
		);
	}

	return (
		<main className={styles.main} style={{ backgroundImage: `url(${background.src})` }}>
			<div className={styles.container}>{gameJSX}</div>
		</main>
	);
};

export default Play;
