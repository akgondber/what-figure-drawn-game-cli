import {IflessString} from 'ifless';
import * as R from 'rambda';

class Grid {
	constructor(columns, rows, {fillValue = '+', hiddenValue = ' '}) {
		this.columns = columns;
		this.iter = 0;
		this.rows = rows;
		this.fillValue = fillValue;
		this.hiddenValue = hiddenValue;
		this.items = [];
		this.comm = 0;
		this.firstRun = true;
		this.displayedItems = [];
		this.direction = 'leftToRight';
		this.animatableDirections = [
			'leftToRight',
			'diagonalLeftDown',
			'rightToLeft',
			'diagonalRightUp',
		];
		this.steps = null;
		this.extraOptions = {};
		this.availableDirections = [
			'leftToRight',
			'diagonal',
			'bottomToUp',
			'diagonalLeftDown',
			'diagonalRightDown',
			'diagonalLeftUp',
			'diagonalRightUp',
		];
		this.animatableDirections = ['leftToRight', 'diagonal', 'bottomToUp'];
		this.animatableFigure = 'triangle';
		this.allPassed = false;
		this.passedDirections = [];
		this.currentShowingPoint = {
			x: 0,
			y: 0,
		};

		for (let i = 0; i < this.rows; i++) {
			this.items[i] = [];
			this.displayedItems[i] = [];

			for (let j = 0; j < this.columns; j++) {
				this.items[i][j] = fillValue;
				this.displayedItems[i][j] = this.hiddenValue;
			}
		}
	}

	hideAt(x, y) {
		this.displayedItems[x][y] = this.hiddenValue;
	}

	hideAll() {
		this.setDisplayableForAll(this.hiddenValue);
	}

	hideLine(lineNumber) {
		for (let i = 0; i < this.columns; i++) {
			if (this.withinBoundaries(lineNumber, i)) {
				this.hideAt(lineNumber, i);
			}
		}
	}

	showInDirection(direction) {
		if (this.availableDirections.includes(direction)) {
			this.direction = direction;
		}
	}

	nextTick() {
		if (this.allPassed) {
			return;
		}

		if (this.firstRun) {
			this.firstRun = false;
			return;
		}

		let needsToRegisterPassedDirections = true;
		const newShowingPoint = this.calculateNextShowingPoint();
		const isHexagon = this.animatableFigure === 'hexagon';

		if (this.steps) {
			if (R.propSatisfies(R.equals(this.iter), this.direction, this.steps)) {
				this.iter = 0;
				this.passedDirections.push(this.direction);
				this.direction = this.calculateNextDirection();
				needsToRegisterPassedDirections = false;
			}
		} else if (isHexagon && this.iter === this.extraOptions.sideLength) {
			this.iter = 0;
			this.passedDirections.push(this.direction);
			this.direction = this.calculateNextDirection();
			needsToRegisterPassedDirections = false;
			if (this.areAllDirectionsPassed()) {
				this.allPassed = true;
				return;
			}
		}

		this.iter++;

		if (this.isLocationWithin(newShowingPoint)) {
			if (this.steps) {
				this.allPassed = this.areAllDirectionsPassed();
			}

			this.currentShowingPoint = newShowingPoint;
		} else {
			if (needsToRegisterPassedDirections) {
				this.passedDirections.push(this.direction);
			}

			this.allPassed = this.areAllDirectionsPassed();
			if (
				!this.allPassed && // If (needsToRegisterPassedDirections) {
				// 	this.direction = this.calculateNextDirection();
				// }
				needsToRegisterPassedDirections
			)
				this.direction = this.calculateNextDirection();
		}

		if (this.allPassed) {
			this.hideAll();
		} else {
			this.showOnlyCurrent();
		}
	}

	calculateNextShowingPoint() {
		const evolveFn = R.partial(R.flip(R.evolve), this.currentShowingPoint);
		// Const calcDiagX = this.animatableFigure === 'hexagon' ? R.add(2) : R.inc;
		const severalIncFigures = ['hexagon', 'triangle'];
		const calcDiagLeft = R.includes(this.animatableFigure, severalIncFigures)
			? R.flip(R.subtract)(2)
			: R.dec;
		const calcDiagRight = R.includes(this.animatableFigure, severalIncFigures)
			? R.add(2)
			: R.inc;
		const calcXRight = R.add(2);
		const calcXLeft = R.flip(R.subtract)(2);

		if (this.direction === 'leftToRight') {
			return evolveFn({
				x: calcXRight,
				y: R.identity,
			});
		}

		const evolvingRule = new IflessString(this.direction)
			.whenOneOf(['diagonalLeftDown', 'diagonal'], {
				x: calcDiagLeft,
				y: R.inc,
			})
			.whenEq('diagonalLeftUp', {
				x: calcDiagLeft,
				y: R.dec,
			})
			.whenEq('diagonalRightDown', {
				x: calcDiagRight,
				y: R.inc,
			})
			.whenEq('diagonalRightUp', {
				x: calcDiagRight,
				y: R.dec,
			})
			.whenEq('bottomToUp', {
				x: R.identity,
				y: R.dec,
			})
			.whenEq('upToBottom', {
				x: R.identity,
				y: R.inc,
			})
			.whenEq('rightToLeft', {
				x: calcXLeft,
				y: R.identity,
			})
			.whenEq('leftToRight', {
				x: calcXRight,
				y: R.identity,
			}).result;

		if (!evolvingRule) {
			throw new Error(`Unsupported direction: ${this.direction}.`);
		}

		return evolveFn(evolvingRule);
	}

	calculateNextDirection() {
		// If (R.includes(this.animatableFigure, ['rectangle', 'square'])) {
		// 	if (this.direction === 'leftToRight') {
		// 		return 'upToBottom';
		// 	}

		// 	if (this.direction === 'upToBottom') {
		// 		return 'rightToLeft';
		// 	}

		// 	if (this.direction === 'rightToLeft') {
		// 		return 'bottomToUp';
		// 	}

		// 	if (this.direction === 'bottomToUp') {
		// 		return 'leftToRight';
		// 	}
		// } else if (this.animatableFigure === 'triangle') {
		// 	if (this.direction === 'leftToRight') {
		// 		return 'diagonal';
		// 	}

		// 	if (this.direction === 'diagonal') {
		// 		return 'bottomToUp';
		// 	}

		// 	if (this.direction === 'bottomToUp') {
		// 		return 'leftToRight';
		// 	}
		// } else if (this.animatableFigure === 'hexagon') {
		// 	if (this.direction === 'diagonalRightUp') {
		// 		return 'diagonalRightDown';
		// 	}
		// 	if (this.direction === 'diagonalRightDown') {
		// 		return 'diagonalLeftDown';
		// 	}
		// 	if (this.direction === 'diagonalLeftDown') {
		// 		return 'diagonalLeftUp';
		// 	}
		// }

		return this.animatableDirections[this.passedDirections.length];

		// Throw new Error('Unsupported animatable figure.');
	}

	areAllDirectionsPassed() {
		return R.eqProps(
			'length',
			this.passedDirections,
			this.animatableDirections,
		);
	}

	setAnimatableFigure(figureName) {
		this.reset();

		switch (figureName) {
			case 'rectangle':
			case 'square': {
				if (figureName === 'square' && this.columns !== this.rows * 2 - 1) {
					throw new Error(
						`A square figure must have equal sides. cols: ${this.columns}x${this.rows}`,
					);
				}

				if (figureName === 'rectangle' && this.columns / 2 === this.rows) {
					throw new Error(`A square figure must not have equal sides`);
				}

				this.availableDirections = [
					'leftToRight',
					'upToBottom',
					'rightToLeft',
					'bottomToUp',
				];
				this.animatableDirections = [
					'leftToRight',
					'upToBottom',
					'rightToLeft',
					'bottomToUp',
				];

				break;
			}

			case 'triangle': {
				this.diagonalDirection = 'leftDown';
				this.animatableDirections = [
					'leftToRight',
					'diagonalLeftDown',
					'bottomToUp',
				];
				this.steps = R.zipObj(
					this.animatableDirections,
					R.repeat(5, this.animatableDirections.length),
				);

				break;
			}

			case 'hexagon': {
				// This.animatableDirections = [
				// 	'diagonalRightUp',
				// 	'leftToRight',
				// 	'diagonalRightDown',
				// 	'upToBottom',
				// 	'diagonalLeftDown',
				// 	'rightToLeft',
				// 	'diagonalLeftUp',
				// 	'bottomToUp',
				// ];
				this.animatableDirections = [
					'diagonalRightUp',
					'diagonalRightDown',
					'upToBottom',
					'diagonalLeftDown',
					'diagonalLeftUp',
					'bottomToUp',
				];
				this.direction = 'diagonalRightUp';
				this.extraOptions = {
					sideLength: 5,
				};
				this.steps = R.zipObj(
					this.animatableDirections,
					R.repeat(4, this.animatableDirections.length),
				);
				this.showOnly(0, 4);

				break;
			}

			case 'rhombus':
			case 'parallelogram': {
				const isRhombus = figureName === 'rhombus';
				this.animatableDirections = [
					'leftToRight',
					isRhombus ? 'diagonalLeftDown' : 'diagonalRightDown',
					'rightToLeft',
					isRhombus ? 'diagonalRightUp' : 'diagonalLeftUp',
				];
				this.steps = {
					leftToRight: isRhombus ? 4 : 12,
					diagonalLeftDown: 5,
					rightToLeft: isRhombus ? 5 : 13,
					diagonalRightUp: 5,
				};
				this.showOnly(10, 0);

				break;
			}

			default: {
				throw new Error('Unsupported animatable figure');
			}
		}

		this.animatableFigure = figureName;
	}

	setAnimatableDirections(value) {
		this.animatableDirections = value;
	}

	setExtraOptions(value) {
		this.extraOptions = value;
	}

	reset() {
		this.allPassed = false;
		this.passedDirections = [];
		this.comm = 0;
		this.iter = 0;
	}

	showOnly(x, y) {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				this.displayedItems[i][j] =
					x === j && y === i ? this.fillValue : this.hiddenValue;
			}
		}

		if (this.withinBoundaries(x, y)) {
			this.currentShowingPoint = {
				x,
				y,
			};
		}
	}

	setDisplayableForAll(value) {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				this.displayedItems[i][j] = value;
			}
		}
	}

	showOnlyLoc({x, y}) {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				this.displayedItems[i][j] =
					x === j && y === i ? this.fillValue : this.hiddenValue;
			}
		}
	}

	showOnlyCurrent() {
		// This.showAt(this.currentShowingPoint.x, this.currentShowingPoint.y);
		this.showOnlyLoc(this.currentShowingPoint);
	}

	showAt(x, y) {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				if (x === j && y === i) {
					// This.displayedItems[i][j] =
					this.displayedItems[i][j] = this.fillValue;
				}
			}
		}
		// This.displayedItems[x][y] = this.items[x][y];
	}

	setAt(x, y, value) {
		if (!this.ensureBoundaries) {
			throw new Error(`Coords ${x}x${y} are out of boundaries!`);
		}

		this.items[x][y] = value;
	}

	withinBoundaries(x, y) {
		const insideBound = (checkable, bound) =>
			R.allPass([R.flip(R.lt)(bound), R.flip(R.gte)(0)])(checkable);
		if (insideBound(x, this.columns) && insideBound(y, this.rows)) {
			return true;
		}

		return false;
	}

	isLocationWithin(location) {
		return this.withinBoundaries(location.x, location.y);
	}

	ensureBoundaries(x, y) {
		if (x < this.columns && y < this.rows) {
			return true;
		}

		return false;
	}

	fillWith(value) {
		this.fillValue = value;

		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				this.items[i][j] = value;
				this.displayedItems[i][j] = value;
			}
		}
	}

	getStr() {
		let result = '';

		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				result += this.displayedItems[i][j];
			}

			result += '\n';
		}

		return result;
	}

	print() {
		let result = '';

		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				result += this.displayedItems[i][j];
			}

			result += '\n';
		}

		console.log(result);
	}
}

export default Grid;
