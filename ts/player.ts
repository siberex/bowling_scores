import {GameRangeError, ERRORCODE, GameError} from "./errors.js";
import {ScoringTenpin, ScoringInterface} from './scoring.js';


class ScoringSheet {
    scratch: number = 0;
    handicap = 0;
    total = 0;
    closed = false;
}

export interface PlayerInterface {
    readonly name: string;
    readonly handicap: number;
    roll(pins: number, isSplit?: boolean): void;
    getScoringSheet(): ScoringSheet;
    printScoringSheet(): void;

    // mtp
    scoring: ScoringInterface;
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
    public scoring = new ScoringTenpin();

    constructor(name: string, handicap = 0) {
        this._name = name;
        this._handicap = handicap;
    }

    roll(pins: number = 0) {
        this.scoring.roll(pins);
    }

    getScoringSheet(): ScoringSheet {
        return new ScoringSheet(); // FIXME
    }

    printScoringSheet() {
        // TODO check if game is not finished yet?

        const sheetStr = this.scoring.frames.map(frame => frame.displayRolls.join(",") + ":" + frame.getScore() + '(' + frame.bonusPoints + ')' + (frame.isLast ? '*': ''));
        const scratch = this.scoring.frames.map(frame => frame.getScore()).reduce((acc, v) => acc + v, 0);
        const total = scratch + this.handicap;

        // FIXME
        console.log(sheetStr);
        console.log(total);
    }

    
}
