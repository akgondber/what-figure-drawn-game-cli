import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './source/app.js';

test('displays instructions message', t => {
	const {lastFrame} = render(<App />);

	t.true(
		lastFrame().includes(
			`Try to figure out a shape whose outline is being drawn with`,
		),
	);
});
