import * as R from 'rambda';

class Grid {
	constructor(columns, rows, {fillValue = '+'}) {
		this.columns = columns;
		this.iter = 0;
		this.rows = rows;
		this.fillValue = fillValue;
		this.hiddenValue = ' ';
		this.items = [];
		this.displayedItems = [];
		this.direction = 'leftToRight';
		this.availableDirections = ['leftToRight', 'diagonal', 'bottomToUp'];
		this.animatableDirections = ['leftToRight', 'diagonal', 'bottomToUp'];
		this.animatableFigure = 'triangle';
		this.allPassed = false;
		this.diagonalDirection = 'leftDown';
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

		this.iter++;
		const newShowingPoint = this.calculateNextShowingPoint();
		if (this.isLocationWithin(newShowingPoint)) {
			this.currentShowingPoint = newShowingPoint;
		} else {
			this.passedDirections.push(this.direction);
			this.allPassed = this.areAllDirectionsPassed();
			if (!this.allPassed) {
				this.direction = this.calculateNextDirection();
			}
		}

		if (this.allPassed) {
			this.hideAll();
		} else {
			this.showOnlyCurrent();
		}
	}

	calculateNextShowingPoint() {
		const evolveFn = R.partial(R.flip(R.evolve), this.currentShowingPoint);
		if (this.direction === 'leftToRight') {
			return evolveFn({
				x: R.inc,
				y: R.identity,
			});
		}

		switch (this.direction) {
			case 'diagonal': {
				if (this.diagonalDirection === 'leftDown') {
					return evolveFn({
						x: R.dec,
						y: R.inc,
					});
				}

				if (this.diagonalDirection === 'leftUp') {
					return evolveFn({
						x: R.dec,
						y: R.dec,
					});
				}

				if (this.diagonalDirection === 'rightDown') {
					return evolveFn({
						x: R.inc,
						y: R.inc,
					});
				}

				if (this.diagonalDirection === 'rightUp') {
					return evolveFn({
						x: R.inc,
						y: R.dec,
					});
				}

				break;
			}

			case 'bottomToUp': {
				return R.evolve(
					{
						x: R.identity,
						y: R.dec,
					},
					this.currentShowingPoint,
				);
			}

			case 'upToBottom': {
				return R.evolve(
					{
						x: R.identity,
						y: R.inc,
					},
					this.currentShowingPoint,
				);
			}

			case 'rightToLeft': {
				return evolveFn({
					x: R.dec,
					y: R.identity,
				});
			}
			// No default
		}
	}

	calculateNextDirection() {
		if (R.includes(this.animatableFigure, ['rectangle', 'square'])) {
			if (this.direction === 'leftToRight') {
				return 'upToBottom';
			}

			if (this.direction === 'upToBottom') {
				return 'rightToLeft';
			}

			if (this.direction === 'rightToLeft') {
				return 'bottomToUp';
			}

			if (this.direction === 'bottomToUp') {
				return 'leftToRight';
			}
		} else if (this.animatableFigure === 'triangle') {
			if (this.direction === 'leftToRight') {
				return 'diagonal';
			}

			if (this.direction === 'diagonal') {
				return 'bottomToUp';
			}

			if (this.direction === 'bottomToUp') {
				return 'leftToRight';
			}
		}

		throw new Error('Unsupported animatable figure.');
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

		if (figureName === 'rectangle' || figureName === 'square') {
			if (figureName === 'square' && this.columns !== this.rows) {
				throw new Error(`A square figure must have equal sides`);
			}

			if (figureName === 'rectangle' && this.columns === this.rows) {
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
		} else if (figureName === 'triangle') {
			this.diagonalDirection = 'leftDown';
		} else {
			throw new Error('Unsupported animatable figure');
		}

		this.animatableFigure = figureName;
	}

	setAnimatableDirections(value) {
		this.animatableDirections = value;
	}

	reset() {
		this.allPassed = false;
		this.passedDirections = [];
	}

	showOnly(x, y) {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.columns; j++) {
				this.displayedItems[i][j] =
					x === j && y === i ? this.fillValue : this.hiddenValue;
			}
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
		this.showOnlyLoc(this.currentShowingPoint);
	}

	showAt(x, y) {
		this.displayedItems[x][y] = this.items[x][y];
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
