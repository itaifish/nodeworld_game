import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { GameComponent } from '../game/ui/GameComponent';

const Play = () => {
	const { data: sessionData } = useSession();
	if (sessionData != null) {
		return <GameComponent sessionData={sessionData} />;
	}
	return <Image src="/loadingIcon.svg" height={30} width={30} alt={'Loading Icon'} />;
};

export default Play;
