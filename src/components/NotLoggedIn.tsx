import Link from 'next/link';
import styles from '../pages/index.module.css';

export function NotLoggedIn() {
	return (
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
	);
}
