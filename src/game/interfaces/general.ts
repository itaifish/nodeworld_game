export type Position = {
	x: number;
	y: number;
};

export type Size = {
	width: number;
	height: number;
};

export type NumberRange = {
	start: number;
	end: number;
};

export type Rect = Position & Size;
