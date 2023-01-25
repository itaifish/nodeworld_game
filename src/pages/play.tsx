import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const PlayGameNoSsr = dynamic(() => import('../components/PlayGame'), {
	ssr: false,
});
const PhaserGamePage: NextPage = () => <PlayGameNoSsr />;

export default PhaserGamePage;
