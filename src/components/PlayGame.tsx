import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { GameComponent } from '../game/ui/GameComponent';
import { Background } from './Background';
import { NotLoggedIn } from './NotLoggedIn';

const Play = () => {
	const { data: sessionData } = useSession();
	if (sessionData == null) {
		return (
			<Background>
				<NotLoggedIn />
			</Background>
		);
	} else {
		return (
			<Background>
				<GameComponent sessionData={sessionData} />
			</Background>
		);
	}
};

export default Play;
