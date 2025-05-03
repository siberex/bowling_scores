import {GameRangeError, ERRORCODE, GameError} from "./errors.js";
import {ScoringTenpin} from './scoring.js';

class ScoringSheet {
    scratch: number = 0;
    handicap = 0;
    total = 0;
}

export interface PlayerInterface {
    readonly name: string;
    readonly handicap: number;
    roll(pins: number, isSplit?: boolean): void;
    getScoringSheet(): void;
}

export class Player implements PlayerInterface {
    _name: string;
    get name() {
        return this._name;
    }
    _handicap: number;
    get handicap() {
        return this._handicap;
    }

    // FIXME: Rely on the interface instead of the concrete class
    protected scoring = new ScoringTenpin();

    constructor(name: string, handicap = 0) {
        this._name = name;
        this._handicap = handicap;
    }

    roll(pins: number = 0) {
        this.scoring.roll(pins);
    }

    getScoringSheet() {
        // TODO check if game is not finished yet?

        const sheetStr = this.scoring.frames.map(frame => frame.displayRolls.join(",") + ":" + frame.getScore());
        const scratch = this.scoring.frames.map(frame => frame.getScore()).reduce((acc, v) => acc + v, 0);
        const total = scratch + this.handicap;

        //
        console.log(sheetStr);
        console.log(total);
    }
}
