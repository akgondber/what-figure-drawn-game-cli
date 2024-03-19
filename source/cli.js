#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {withFullScreen} from 'fullscreen-ink';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ what-figure-drawn-game-cli

		Options
			--fullscren  Whether to use fullscreen mode

		Examples
		  $ what-figure-drawn-game-cli
		  $ what-figure-drawn-game-cli --fullscreen
		  $ what-figure-drawn-game-cli -f
	`,
	{
		importMeta: import.meta,
		flags: {
			fullscreen: {
				type: 'boolean',
				shortFlag: 'f',
				default: false,
			},
		},
	},
);

if (cli.flags.fullscreen) withFullScreen(<App />, {exitOnCtrlC: false}).start();
else render(<App />);
