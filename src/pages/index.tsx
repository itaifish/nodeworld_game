import styles from './index.module.css';
import { type NextPage } from 'next';
import Head from 'next/head';
import { signIn, signOut, useSession } from 'next-auth/react';
import background from '../../public/endless-constellation.svg';

import { api } from '../utils/api';

const LoginButton: React.FC = () => {
	const { data: sessionData } = useSession();

	const { data: baseData } = api.base.getBaseData.useQuery();

	return (
		<div className={styles.authContainer}>
			<p className={styles.showcaseText}>
				{sessionData && <span>Logged in as {sessionData.user?.name}</span>}
				{baseData && <> {baseData} </>}
			</p>
			{sessionData && (
				<button className={styles.loginButton} onClick={() => {}}>
					Enter Game
				</button>
			)}
			<button className={styles.loginButton} onClick={sessionData ? () => void signOut() : () => void signIn()}>
				{sessionData ? 'Sign out' : 'Sign in'}
			</button>
		</div>
	);
};

const Home: NextPage = () => {
	return (
		<>
			<Head>
				<title>Nodeworld</title>
				<meta name="description" content="The next best thing" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className={styles.main} style={{ backgroundImage: `url(${background.src})` }}>
				<div className={styles.container}>
					<h1 className={styles.title}>
						Play <span className={styles.pinkSpan}>Node</span>World
					</h1>
					<div className={styles.showcaseContainer}>
						<LoginButton />
					</div>
				</div>
			</main>
		</>
	);
};

export default Home;
