import type { Galaxy } from '@prisma/client';
import { useState } from 'react';
import styled, { css, keyframes } from 'styled-components';

const spin = keyframes`
	0%   { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
	width: 34px;
	height: 34px;
	border: 4px solid #2bb7f667;
	border-top: 4px solid #a749e4;
	border-right: 4px solid #43e0f7;
	border-bottom: 4px solid transparent;
	border-left: 4px solid transparent;
	border-radius: 50%;
	background: none;
	animation: ${spin} 1s linear infinite;
	box-shadow: 0 0 12px #650be930;
	display: inline-block;
	margin-left: 6px;
`;

const Title = styled.h2`
	text-align: center;
	color: rgb(19, 238, 205);
	font-size: 2rem;
	margin-bottom: 1.5rem;
	font: 800 40px 'Orbitron', Arial, sans-serif;
	letter-spacing: 2px;
	-webkit-text-fill-color: rgb(10, 35, 164);
	-webkit-text-stroke: 1px;
`;

const ListContainer = styled.div`
	background: linear-gradient(120deg, #6e21d1 0%, #2bb7f6 100%);
	padding: 2rem;
	border-radius: 2rem;
	min-width: 450px;
	max-width: 800px;
	margin: 2rem auto;
	box-shadow: 0 0 40px #9727e9, 0 0 80px #34f5ff30;
`;

const GalaxyItemStyles = css`
	border-radius: 1rem;
	margin-bottom: 1.25rem;
	padding: 1.5rem 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: #e5dbfa;
	box-shadow: 0 0 18px #9603e733;
`;

const GalaxyItem = styled.div`
	${GalaxyItemStyles}
	background: rgba(55, 0, 128, 0.7);
	border: 1.5px solid #2bb7f6;
`;

const SpecialGalaxyItem = styled.div`
	${GalaxyItemStyles}
	background: linear-gradient(90deg, #fff9b2, 10%, ffe0fa, 100%);
	border: 2px solid #ffd700;
	box-shadow: 0 0 30px #ffeeff99, 0 0 60px #ffe34d30;
	text-shadow: #42006e;
`;

const GalaxyInfo = styled.div`
	display: flex;
	flex-direction: column;
`;

const GalaxyName = styled.span`
	font-size: 1.35rem;
	font-weight: bold;
	letter-spacing: 1px;
`;

const GalaxyCount = styled.span`
	font-size: 1rem;
	color: #67e0ff;
	margin-top: 3px;
`;

export const JoinButton = styled.button`
	background: linear-gradient(90deg, #a749e4 30%, #43e0f7 100%);
	color: #fff;
	border: none;
	border-radius: 2rem;
	font-size: 1rem;
	font-weight: bold;
	cursor: pointer;
	padding: 0.65rem 1.5rem;
	transition: transform 0.09s, box-shadow 0.2s;
	box-shadow: 0 0 12px #650be930;

	&:hover {
		transform: translateY(-2px) scale(1.03);
		box-shadow: 0 2px 22px #2bb7f6;
	}
`;

export type GalaxyWithLinkedUser = Galaxy & {
	linkedUsers: {
		id: string;
		userId: string;
		galaxyId: string;
	}[];
};

type GalaxySelectionTableProps = {
	galaxies: GalaxyWithLinkedUser[];
	userCurrentGalaxy: Galaxy | null;
	joinGalaxyAction: (galaxyId: string) => Promise<void>;
};

export function GalaxySelectionTable({ galaxies, joinGalaxyAction, userCurrentGalaxy }: GalaxySelectionTableProps) {
	const [loadingGalaxy, setLoadingGalaxy] = useState<string | null>(null);
	const joinGalaxy = async (galaxyId: string) => {
		setLoadingGalaxy(galaxyId);
		await joinGalaxyAction(galaxyId);
		// uncommenting this makes the join buttons flash in again
		// setLoadingGalaxy(null);
	};
	return (
		<ListContainer>
			<Title>Choose a Galaxy</Title>
			{userCurrentGalaxy && (
				<SpecialGalaxyItem key={userCurrentGalaxy.id}>
					<GalaxyInfo>
						<GalaxyName>{userCurrentGalaxy.name}</GalaxyName>
						<GalaxyCount>Your most recent Galaxy</GalaxyCount>
					</GalaxyInfo>
					{loadingGalaxy === null ? (
						<JoinButton
							onClick={() => {
								joinGalaxy(userCurrentGalaxy.id);
							}}
						>
							Join
						</JoinButton>
					) : (
						<>{userCurrentGalaxy.id === loadingGalaxy && <Spinner />}</>
					)}
				</SpecialGalaxyItem>
			)}
			{galaxies
				.filter((galaxy) => galaxy.id != userCurrentGalaxy?.id)
				.map((galaxy) => (
					<GalaxyItem key={galaxy.name}>
						<GalaxyInfo>
							<GalaxyName>{galaxy.name}</GalaxyName>
							<GalaxyCount>
								{galaxy.linkedUsers.length} / {galaxy.maxSize}
							</GalaxyCount>
						</GalaxyInfo>
						{loadingGalaxy === null ? (
							<JoinButton
								onClick={() => {
									joinGalaxy(galaxy.id);
								}}
							>
								Join
							</JoinButton>
						) : (
							<>{galaxy.id === loadingGalaxy && <Spinner />}</>
						)}
					</GalaxyItem>
				))}
		</ListContainer>
	);
}
