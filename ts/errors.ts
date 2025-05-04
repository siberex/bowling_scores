
export const enum ERRORCODE {
    unknown,
    scoring_not_implemented,
    roll_is_negative,
    roll_exceeds_max_pins,
    frame_exceeds_max_pins,
    player_not_found,
    action_not_implemented,
    no_more_rolls_available,
    no_more_frames_available,
};

type ErrorDetails = {
    code: ERRORCODE,
    pins?: number,
};

export class GameError extends Error {
    details: ErrorDetails | undefined;
    code = ERRORCODE.unknown;

    constructor(message: string, details?: ErrorDetails) {
        super(message);
        this.details = details;
        if (details !== undefined) {
            this.code = details.code;
        }

        // Maintains proper stack trace for where our error was thrown (non-standard)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GameError);
        }
    }
}

export class GameSetupError extends GameError {}

export class GameRangeError extends RangeError {
    details: ErrorDetails | undefined;
    code = ERRORCODE.unknown;

    constructor(message: string, details?: ErrorDetails) {
        super(message);
        this.details = details;
        if (details !== undefined) {
            this.code = details.code;
        }

        // Maintains proper stack trace for where our error was thrown (non-standard)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GameRangeError);
        }
    }
}
