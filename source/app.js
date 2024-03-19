import React, {useEffect} from 'react';
import {Text, Box, useApp, useInput} from 'ink';
import TextInput from 'ink-text-input-2';
import {proxy, useSnapshot} from 'valtio';
import * as R from 'rambda';
import figureSet from 'figures';
import {nanoid} from 'nanoid';

const state = proxy({
	count: 0,
	status: 'PAUSED',
	newLinesCount: 0,
	spaceCount: 0,
	diagX: 0,
	diagY: 0,
	directions: [],
	intervalId: null,
	answer: '',
});

export default function App() {
	const {exit} = useApp();
	const snap = useSnapshot(state);

	useEffect(() => {
		return () => {
			if (state.intervalId) {
				clearInterval(state.intervalId);
			}
		};
	}, []);

	useInput(
		(input, _key) => {
			if (input === 'q') {
				exit();
			}

			if (input === 'y') {
				state.status = 'RUNNING';
				state.newLinesCount = 13;
				state.spaceCount = 0;
				state.diagX = 0;
				state.diagY = 0;
				state.directions = [
					{name: 'bottomUp', passed: false},
					{name: 'rightLeft', passed: false},
					{name: 'diagonal', passed: false},
				];
				const interval = setInterval(() => {
					// FigureSet.squareSmallFilled;
					const newNewLinesCount = state.newLinesCount - 1;
					const bottomUpIndex = R.findIndex(
						R.propEq('bottomUp', 'name'),
						state.directions,
					);
					const rightLeftIndex = R.findIndex(
						R.propEq('rightLeft', 'name'),
						state.directions,
					);
					const diagonalIndex = R.findIndex(
						R.propEq('diagonal', 'name'),
						state.directions,
					);
					let bottomUpPassed = R.path(
						[bottomUpIndex, 'passed'],
						state.directions,
					);

					if (newNewLinesCount > 0 && !bottomUpPassed)
						state.newLinesCount = newNewLinesCount;
					else if (
						R.pathEq([bottomUpIndex, 'passed'], false, state.directions)
					) {
						state.directions = R.set(
							R.lensPath([bottomUpIndex, 'passed']),
							true,
							state.directions,
						);
					}

					const newSpaceCount = state.spaceCount + 1;
					bottomUpPassed = R.path([bottomUpIndex, 'passed'], state.directions);
					const rightLeftPassed = R.path(
						[rightLeftIndex, 'passed'],
						state.directions,
					);
					const diagonalPassed = R.path(
						[diagonalIndex, 'passed'],
						state.directions,
					);

					if (newSpaceCount < 14 && bottomUpPassed) {
						state.spaceCount = newSpaceCount;
					} else if (bottomUpPassed && !rightLeftPassed) {
						state.directions = R.set(
							R.lensPath([rightLeftIndex, 'passed']),
							true,
							state.directions,
						);
					}

					if (bottomUpPassed && rightLeftPassed && !diagonalPassed) {
						const newX = state.diagX - 1;
						const newY = state.diagY - 1;

						if (Math.abs(newX) > 13 && Math.abs(newY) > 13) {
							state.directions = R.set(
								R.lensPath([diagonalIndex, 'passed']),
								true,
								state.directions,
							);
						} else {
							state.diagX = newX;
							state.diagY = newY;
						}
					}

					if (R.all(R.propEq(true, 'passed'), state.directions)) {
						state.status = 'ASKING';
						clearInterval(interval);
					}
				}, 500);
				state.intervalId = interval;
			}
		},
		{isActive: snap.status !== 'RUNNING'},
	);

	useInput(
		(input, _key) => {
			if (input === 'q') {
				exit();
			}
		},
		{isActive: snap.status === 'RUNNING'},
	);

	if (snap.status === 'ASKING') {
		return (
			<Box flexDirection="column">
				<Text>What figure was drawn?</Text>
				<TextInput
					value={snap.answer}
					onChange={value => {
						state.answer = value;
					}}
					onSubmit={value => {
						state.result = value === 'triangle' ? 'SUCCESS' : 'FAILURE';
						state.status = 'FINISHED';
					}}
				/>
			</Box>
		);
	}

	if (snap.status === 'FINISHED') {
		return (
			<Box flexDirection="column">
				<Text>Game over</Text>
				<Box>
					{snap.result === 'SUCCESS' ? (
						<Text color="green">You won</Text>
					) : (
						<Text color="red">You lost</Text>
					)}
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			{snap.status === 'RUNNING' ? (
				<>
					{R.times(
						() => (
							<Text key={nanoid()}>{` `}</Text>
						),
						Math.abs(snap.newLinesCount + snap.diagY),
					)}
					<Box>
						<Text>
							{R.join(
								'',
								R.times(() => ` `, Math.abs(snap.spaceCount + snap.diagX)),
							)}
							{figureSet.squareSmallFilled}
						</Text>
					</Box>
				</>
			) : (
				<Text>
					Try to find out which figure is being drawn by marker. Are you ready?
					Press{' '}
					<Text bold color="cyan">
						y
					</Text>{' '}
					to start.
				</Text>
			)}
		</Box>
	);
}
