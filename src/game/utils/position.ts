

import * as Direction from "./direction";

class DirectionDelta {
  constructor(
    readonly xDelta: number,
    readonly yDelta: number,
  ) {}
}

type MovementDirection = Direction.Direction;

function getDeltaFor(direction: MovementDirection): DirectionDelta {
  switch (direction) {
    case Direction.NORTH:
      return new DirectionDelta(0, -1);
    case Direction.NORTHEAST:
      return new DirectionDelta(1, -1);
    case Direction.EAST:
      return new DirectionDelta(1, 0);
    case Direction.SOUTHEAST:
      return new DirectionDelta(1, 1);
    case Direction.SOUTH:
      return new DirectionDelta(0, 1);
    case Direction.SOUTHWEST:
      return new DirectionDelta(-1, 1);
    case Direction.WEST:
      return new DirectionDelta(-1, 0);
    case Direction.NORTHWEST:
      return new DirectionDelta(-1, -1);
    default:
      throw new Error(`Unexpected direction!`);
  }
}

export class Position {
  x: any;
  y: any;
  static move(position: Position, direction: MovementDirection): Position {
    const { x, y } = position;
    const { xDelta, yDelta } = getDeltaFor(direction);
    return new Position(x + xDelta, y + yDelta);
  }

  static origin(): Position {
    return new Position(0, 0);
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}
