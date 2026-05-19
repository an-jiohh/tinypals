import type { PetDirection } from "./petTypes";

export function getDragDirectionChange(
  deltaX: number,
  currentDirection: PetDirection | undefined
): PetDirection | undefined {
  const nextDirection = getDragDirection(deltaX, currentDirection);

  return nextDirection === currentDirection ? undefined : nextDirection;
}

function getDragDirection(
  deltaX: number,
  currentDirection: PetDirection | undefined
): PetDirection {
  if (deltaX < 0) {
    return "left";
  }

  if (deltaX > 0) {
    return "right";
  }

  return currentDirection ?? "right";
}
