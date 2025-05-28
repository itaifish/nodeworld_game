import { useSession } from 'next-auth/react';
import { Background } from '../Background';
import { NotLoggedIn } from '../NotLoggedIn';
import type { GalaxyWithLinkedUser } from './GalaxySelectionTable';
import { GalaxySelectionTable } from './GalaxySelectionTable';
import { useEffect, useState } from 'react';
import { trpcClientManager } from 'src/game/manager/TRPCClientManager';
import { FancyLoadingText } from 'src/game/ui/loading/FancyLoadingText';
import { Galaxy } from '@prisma/client';

export default function SelectGalaxy() {
	const { data: sessionData } = useSession();
	const [galaxies, setGalaxies] = useState<GalaxyWithLinkedUser[]>([]);
	const [userCurrentGalaxy, setUserCurrentGalaxy] = useState<Galaxy | null>(null);
	const [showErrorIfNoSessionData, setShowErrorIfNoSessionData] = useState(false);

	useEffect(() => {
		setTimeout(() => setShowErrorIfNoSessionData(true), 2_000);
	}, []);

	useEffect(() => {
		const loadGalaxies = async () => {
			const { galaxies, userCurrentGalaxy } = await trpcClientManager
				.getClient()
				.galaxy.listAvailableGalaxiesAndUserCurrentGalaxy.query({ cursor: undefined });
			setGalaxies(galaxies);
			setUserCurrentGalaxy(userCurrentGalaxy);
		};
		loadGalaxies();
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
					const client = trpcClientManager.getClient();
					await client.galaxy.userJoinGalaxy.mutate({ galaxyId });
					window.location.href = '/play';
				}}
			/>
		</Background>
	);
}
