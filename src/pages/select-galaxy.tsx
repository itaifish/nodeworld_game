import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const SelectGalaxyNoSsr = dynamic(() => import('../components/galaxy/SelectGalaxy'), {
	ssr: false,
});
const PhaserGalaxySelectPage: NextPage = () => <SelectGalaxyNoSsr />;

export default PhaserGalaxySelectPage;
