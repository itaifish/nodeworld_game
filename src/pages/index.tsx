import styles from './index.module.css';
import { type NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

import { api } from '../utils/api';

const AuthShowcase: React.FC = () => {
	const { data: sessionData } = useSession();

	const { data: baseData } = api.base.getBaseData.useQuery();

	return (
		<div className={styles.authContainer}>
			<p className={styles.showcaseText}>
				{sessionData && <span>Logged in as {sessionData.user?.name}</span>}
				{baseData && <> {baseData} </>}
			</p>
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
			<main className={styles.main}>
				<div className={styles.container}>
					<h1 className={styles.title}>
						Play <span className={styles.pinkSpan}>Node</span>World
					</h1>
					<div className={styles.showcaseContainer}>
						<AuthShowcase />
					</div>
				</div>
			</main>
		</>
	);
};

export default Home;
