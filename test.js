import React from 'react';
import test from 'ava';
import chalk from 'chalk';
import {render} from 'ink-testing-library';
import App from './source/app.js';

test('greet unknown user', t => {
	const {lastFrame} = render(<App />);

	t.is(
		lastFrame(),
		`Try to find out which figure is being drawn by marker. Are you ready? Press ${chalk.bold.cyan('y')} to start.`,
	);
});
