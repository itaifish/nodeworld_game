import styles from '../pages/index.module.css';
import background from '../../public/endless-constellation.svg';

export function Background({ children }: { children: React.ReactNode }) {
	return (
		<main className={styles.main} style={{ backgroundImage: `url(${background.src})` }}>
			<div style={{ gap: '0rem', padding: '0rem 0rem', height: '100%' }}>{children}</div>
		</main>
	);
}
