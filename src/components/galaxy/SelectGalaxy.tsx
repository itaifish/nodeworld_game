import { useSession } from 'next-auth/react';
import { Background } from '../Background';
import { NotLoggedIn } from '../NotLoggedIn';
import type { GalaxyWithLinkedUser } from './GalaxySelectionTable';
import { GalaxySelectionTable, JoinButton } from './GalaxySelectionTable';
import { useEffect, useState } from 'react';
import { trpcClientManager } from 'src/game/manager/TRPCClientManager';
import { FancyLoadingText } from 'src/game/ui/loading/FancyLoadingText';
import type { Galaxy } from '@prisma/client';
import { log } from 'src/utility/logger';

export default function SelectGalaxy() {
	const { data: sessionData } = useSession();
	const [galaxies, setGalaxies] = useState<GalaxyWithLinkedUser[]>([]);
	const [userCurrentGalaxy, setUserCurrentGalaxy] = useState<Galaxy | null>(null);
	const [showErrorIfNoSessionData, setShowErrorIfNoSessionData] = useState(false);
	const client = trpcClientManager.getClient();
	useEffect(() => {
		setTimeout(() => setShowErrorIfNoSessionData(true), 2_000);
	}, []);

	useEffect(() => {
		const loadGalaxies = async () => {
			const { galaxies, userCurrentGalaxy } = await client.galaxy.listAvailableGalaxiesAndUserCurrentGalaxy.query({
				cursor: undefined,
			});
			setGalaxies(galaxies);
			setUserCurrentGalaxy(userCurrentGalaxy);
		};
		loadGalaxies();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionData]);

	if (sessionData == null) {
		if (!showErrorIfNoSessionData) {
			return (
				<Background>
					<FancyLoadingText />
				</Background>
			);
		}
		return (
			<Background>
				<NotLoggedIn />
			</Background>
		);
	}

	if (galaxies.length === 0) {
		return (
			<Background>
				<FancyLoadingText />
			</Background>
		);
	}

	return (
		<Background>
			<GalaxySelectionTable
				galaxies={galaxies}
				userCurrentGalaxy={userCurrentGalaxy}
				joinGalaxyAction={async (galaxyId) => {
					await client.galaxy.userJoinGalaxy.mutate({ galaxyId });
					window.location.href = '/play';
				}}
			/>
			{sessionData?.user?.isAdmin && (
				<JoinButton
					onClick={() => {
						try {
							client.galaxy.createNewGalaxy.mutate({
								galaxyName: 'BeezleBorp',
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
			)}
		</Background>
	);
}
