
export class GameError extends Error {
    constructor(message: string, options?: object) {
        super(message);

        // Maintains proper stack trace for where our error was thrown (non-standard)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GameError);
        }
    }
}

export class GameRangeError extends RangeError {
    constructor(message: string, options?: object) {
        super(message);

        // Maintains proper stack trace for where our error was thrown (non-standard)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GameRangeError);
        }
    }
}

export const enum ERRORCODE {
    roll_is_negative,
    roll_exceeds_max_pins,
    player_not_found

};