import React, {useEffect} from 'react';
import {Text, Box, useApp, useInput} from 'ink';
import TextInput from 'ink-text-input-2';
import {proxy, useSnapshot} from 'valtio';
import * as R from 'rambda';
import figureSet from 'figures';
import Gradient from 'ink-gradient';
import {IflessString} from 'ifless';
import Grid from './grid.js';
import {exitNow} from './cli.js';

const randomItem = array => array[Math.floor(Math.random() * array.length)];

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
	grd: new Grid(9, 9, {fillValue: figureSet.squareSmall}),
	roundFigure: '',
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
				exitNow();
			}

			if (R.includes(input, ['y', 'n'])) {
				state.status = 'RUNNING';
				state.answer = '';
				state.newLinesCount = 13;
				state.spaceCount = 0;
				state.diagX = 0;
				state.diagY = 0;
				state.directions = [
					{name: 'bottomUp', passed: false},
					{name: 'rightLeft', passed: false},
					{name: 'diagonal', passed: false},
				];

				const roundFigure =
					randomItem(
						R.flatten(
							R.repeat(
								['triangle', 'rectangle', 'square', 'hexagon', 'rhombus'],
								15,
							),
						),
					) === 'cs'
						? 'square'
						: 'square';
				const iflessString = new IflessString(roundFigure);
				const columns = iflessString
					.whenEq('hexagon', 17)
					.whenEq('rectangle', 31)
					.whenEq('rhombus', 33)
					.otherwise(19).result;
				const rows = iflessString
					.reset()
					.whenEq('hexagon', 17)
					.whenEq('rhombus', 5)
					.otherwise(10).result;
				const roundGrid = new Grid(columns, rows, {
					fillValue: figureSet.bullet,
					hiddenValue: ' ',
				});
				roundGrid.setAnimatableFigure(roundFigure);
				state.grd = roundGrid;
				state.roundFigure = roundFigure;

				const interval = setInterval(() => {
					state.grd.nextTick();
					if (state.grd.allPassed) {
						state.status = 'ASKING';
						clearInterval(interval);
					}
				}, 500);
				state.intervalId = interval;
			}
		},
		{isActive: R.complement(R.includes)(snap.status, ['RUNNING', 'ASKING'])},
	);

	useInput(
		(input, _key) => {
			if (input === 'q') {
				exit();
				exitNow();
			}
		},
		{isActive: snap.status === 'RUNNING'},
	);

	if (snap.status === 'ASKING') {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center">
				<Text>What figure was drawn?</Text>
				<TextInput
					value={snap.answer}
					onChange={value => {
						state.answer = value;
					}}
					onSubmit={value => {
						state.result = value === snap.roundFigure ? 'SUCCESS' : 'FAILURE';
						state.status = 'FINISHED';
					}}
				/>
			</Box>
		);
	}

	if (snap.status === 'FINISHED') {
		return (
			<Box flexDirection="column" columnGap={2} alignItems="center">
				<Text>Game over</Text>
				{snap.result === 'SUCCESS' ? (
					<Box marginTop={1} flexDirection="column" rowGap={1}>
						<Text color="green">You won!</Text>
						<Text>
							<Text color="green">{figureSet.tick}</Text>
							{` ${snap.roundFigure}`}
						</Text>
					</Box>
				) : (
					<Box marginTop={1} flexDirection="column" rowGap={1}>
						<Text color="red">You lost</Text>
						<Box flexDirection="column">
							<Text>
								<Text color="red">{figureSet.cross}</Text>
								{` ${snap.answer}`}
							</Text>
							<Text>
								<Text color="green">{figureSet.tick}</Text>
								{` ${snap.roundFigure}`}
							</Text>
						</Box>
					</Box>
				)}
				<Box paddingTop={1}>
					<Text>
						{' '}
						<Text bold color="cyan">
							n
						</Text>{' '}
						- start new round
					</Text>
					<Text>
						{' '}
						<Text bold color="cyan">
							q
						</Text>{' '}
						- quit
					</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			{snap.status === 'RUNNING' ? (
				<Box alignItems="center" justifyContent="center">
					<Box>
						<Text>{snap.grd.getStr()}</Text>
					</Box>
					<Box />
				</Box>
			) : (
				<Box flexDirection="column" alignItems="center" rowGap={2}>
					<Gradient name="fruit">
						<Text>what-figure-drawn-game</Text>
					</Gradient>
					<Text>
						Try to figure out a shape whose outline is being drawn with a
						marker, the previous mark of which is erased.
						{figureSet.arrowDown}
					</Text>
					<Text>
						Are you ready? Press{' '}
						<Text bold color="cyan">
							y
						</Text>{' '}
						to start.
					</Text>
				</Box>
			)}
		</Box>
	);
}
