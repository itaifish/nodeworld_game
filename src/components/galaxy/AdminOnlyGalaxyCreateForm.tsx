import { useSession } from 'next-auth/react';
import { JoinButton } from './GalaxySelectionTable';
import { trpcClientManager } from 'src/game/manager/TRPCClientManager';
import { log } from 'src/utility/logger';
import { useState } from 'react';

export function AdminOnlyGalaxyCreateForm() {
	const { data: sessionData } = useSession();
	const client = trpcClientManager.getClient();

	const [galaxyName, setGalaxyName] = useState('');
	const [maxPlayers, setMaxPlayers] = useState('');

	if (sessionData?.user?.isAdmin !== true) {
		return <></>;
	}
	return (
		<>
			<input type="text" value={galaxyName} onChange={(e) => setGalaxyName(e.target.value)}></input>
			<JoinButton
				onClick={() => {
					try {
						client.galaxy.createNewGalaxy.mutate({
							galaxyName,
							maxPlayers: 50,
							size: { width: 50, height: 50 },
						});
					} catch (e) {
						log.error(e);
					}
				}}
			>
				Create New Galaxy
			</JoinButton>
		</>
	);
}
