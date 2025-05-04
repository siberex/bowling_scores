import {ScoringTenpin, ScoringInterface, FrameType} from './scoring.js';

export class FrameDisplay {
    protected readonly _rolls: Array<string>;
    get rolls() { return this._rolls; }
    protected readonly _index: number;
    get index() { return this._index; }
    protected readonly _score: number;
    get score() { return this._score; }
    readonly isStrike: boolean = false;
    readonly isSpare: boolean = false;
    constructor(index: number, score: number, rolls: Array<string>, type: FrameType) {
        this._index = index;
        this._rolls = rolls;
        this._score = score;
        this.isSpare = (type === FrameType.Spare);
        this.isStrike = (type === FrameType.Strike);
    }
}

export class ScoringSheet {
    scratch = 0;
    handicap = 0;
    readonly _total = 0;
    get total() {
        return this.scratch + this.handicap;
    }
    closed = false;
    frames: Array<FrameDisplay> = [];
    toString() {
        return (
            this.frames.map(f => f.rolls.join(" ")).join("\t") + "\n"
            + this.frames.map(f => f.score.toString()).join("\t")
            + (this.closed && this.handicap > 0 ? `\t + ${this.handicap} = ${this.total}` : "")
        );
    }
}

export interface PlayerInterface {
    readonly name: string;
    readonly handicap: number;
    roll(pins: number, isSplit?: boolean): void;
    getScoringSheet(): ScoringSheet;
    printScoringSheet(): void;
    scoring: ScoringInterface;
}

export class Player implements PlayerInterface {
    readonly _name: string;
    get name() {
        return this._name;
    }
    readonly _handicap: number;
    get handicap() {
        return this._handicap;
    }

    public scoring = new ScoringTenpin();

    constructor(name: string, handicap = 0) {
        this._name = name;
        this._handicap = handicap;
    }

    roll(pins: number = 0) {
        this.scoring.roll(pins);
    }

    getScoringSheet(): ScoringSheet {
        const sheet = new ScoringSheet();

        sheet.closed = this.scoring.closed;
        sheet.handicap = this.handicap;

        let accumulated = 0;
        this.scoring.frames.forEach((frame, index) => {
            accumulated += frame.getScore();
            sheet.frames.push(new FrameDisplay(index, accumulated, frame.displayRolls, frame.type));
        });

        sheet.scratch = accumulated;
        return sheet;
    }

    printScoringSheet() {
        const sheet = this.getScoringSheet();
        console.log(
            this.name + (sheet.closed ? "" : " [IN PROGRESS]") + ":\n"
            + sheet.toString()
        );
    }

    
}
