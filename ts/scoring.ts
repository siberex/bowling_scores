import {GameError, GameRangeError, ERRORCODE} from "./errors.js";

// https://en.wikipedia.org/wiki/Tenpin_bowling#Traditional_scoring
// https://en.wikipedia.org/wiki/Tenpin_bowling#World_Bowling_scoring
// https://en.wikipedia.org/wiki/Candlepin_bowling#Scoring
// https://en.wikipedia.org/wiki/Perfect_game_(bowling)
export const enum GameType {
    Tenpin = "TENPIN",
    Tenpin_IBF = "TENPIN_IBF",
    Ninepin_EU = "NINEPIN_EU",
    Ninepin_US = "NINEPIN_US",
    Candlepin = "CANDLEPIN",
    Duckpin = "DUCKPIN",
    Fivepin = "FIVEPIN",
};

const enum FrameType {
    Open = "OPEN", // player does not knock down all ten pins during their two turns (one or more pins are standing at the deck)
    Strike = "STRIKE", // player knocks down all ten pins with the first turn, marked "X"
    Spare = "SPARE", // player knocks down all ten pins with their two turns, marked "/"
    // related to roll, not frame
    Gutter = "GUTTER", // no pins are hit (ball rolls into one of the gutters), marked "-"
    
    // Meta type, roll can be marked as a Foul. It is always done manually. And sometimes retrospectively.
    // Foul: player’s body touches or crosses beyond the foul line and touches any part of the lane.
    // Foul: player does not release the ball within 30s timeout.
    // Marked "F"
    // Foul = "FOUL",

    // Meta type, marked retrospectively after the roll.
    // Split: headpin knocked down, but there are two or more non-adjacent (i.e. at least 1 pin apart) groups of pins left
    // Highlighted in red or with a circle around a pin number.
    // Split = "SPLIT", 

    // Those are Game achievments, not frame types per se
    // Turkey = "TURKEY", // three strikes in a row, "🦃"
    // Double — two strikes in a row
    // Hambone or Llama or four-bagger — four strikes in a row
    // Brat — five X in a row
    // Wild Turkey or six-pack = 6X
    // Front seven = 7X
    // Octopus = 8X "🐙"
    // Golden Turkey = 9X
    // Front Ten = 10X
    // Front eleven = 11X
    // Dinosaur = 12X (A Perfect Game), "🦕"
};

class Frame {
    type: FrameType = FrameType.Open;
    readonly maxRoll: number;

    // Valid examples: [10], [0, 0], [2, 8], [5, 0], [10, 10, 5], [7, 3, 0], [10, 0, 0], [10, 6, 4]
    // Invalid examples: [10, 0, 5], [10, 2], [8, 8]
    rolls: Array<number> = [];
    displayRolls: Array<string> = [];

    bonusPoints = 0;

    readonly isLast: boolean;

    constructor(maxRoll: number, isLast = false) {
        this.maxRoll = maxRoll;
        this.isLast = isLast;
    }

    getScore(): number {
        return this.rolls.reduce((acc, v) => acc + v, 0) + this.bonusPoints;
    }

    verifyScore(score: number) {
        if (score < 0) {
            throw new GameRangeError(`Negative knocked pins (${score})`, {code: ERRORCODE.roll_is_negative, pins: score});
        }

        if (score > this.maxRoll) {
            throw new GameRangeError(
                `Knocked pin count (${score}) exceeds the maximum allowed number (${this.maxRoll})`,
                {code: ERRORCODE.roll_exceeds_max_pins, pins: score}
            );
        }

        if (this.rolls.length > 0) {
            const prevRoll =  this.rolls.at(-1) ?? 0;
            if ((score + prevRoll) > this.maxRoll) {
                throw new GameRangeError(
                    `Frame score (${score} + ${prevRoll}) exceeds the maximum allowed number (${this.maxRoll})`,
                    {code: ERRORCODE.roll_exceeds_max_pins, pins: (score + prevRoll)}
                );
            }
        }
    }

    isRollAllowed(): boolean {
        return true;
    }

    roll(score = 0) {
        this.verifyScore(score);
        // ...        
    }
}

class FrameTenpin extends Frame {
    isRollAllowed(): boolean {
        return true;
    }
    
    roll(score = 0) {
        this.verifyScore(score);

        if (this.rolls.length === 0) {
            // Strike
            if (score === this.maxRoll) {
                this.type = FrameType.Strike;
                this.displayRolls = ['X'];
            } else {
                this.displayRolls.push(score > 0 ? score.toString() : "-");
            }
        } else if (this.rolls.length === 1) {
            // Spare
            if ((score + this.rolls[0]) === this.maxRoll) {
                this.type = FrameType.Spare;
                this.displayRolls.push("/");
            } else {
                this.displayRolls.push(score > 0 ? score.toString() : "-");
            }

            // Gutter
            if (this.rolls[0] === 0 && score === 0) {
                this.type = FrameType.Gutter;
                this.displayRolls.push("-");
            }

            // Last frame: look behind for strikes
            if (this.isLast && this.rolls[0] === this.maxRoll) {
                this.bonusPoints += score;
            }
        } else if (this.isLast && this.rolls.length === 2) {
            this.rolls.push(score);

            // Look behind for strikes or spares
            if ( this.rolls[0] === this.maxRoll || (this.rolls[0] + this.rolls[1] === this.maxRoll) ) {
                this.bonusPoints += score;
            }

            let displayScore = score > 0 ? score.toString() : "-";
            if (score === this.maxRoll) {
                displayScore = "X";
            } else if ( (score + this.rolls[1]) === this.maxRoll ) {
                displayScore = "/";
            }
            this.displayRolls.push(displayScore);
        } else { // this.rolls.length > 1 or > 2 on the lastFrame
            // Not allowed more than two rolls in a frame which is not last
            // Not allowed more than three rolls on a last frame
            throw new GameError(`No more rolls available`, {code: ERRORCODE.no_more_rolls_available});    
        }

        this.rolls.push(score);
    }
}


interface ScoringInterface {
    type: GameType;
    roll(pins: number): void;
}

// There should be at least one absolutely useless abstraction
abstract class Scoring implements ScoringInterface {
    abstract readonly type: GameType;
    abstract readonly maxRoll: number;
    abstract readonly maxFrames: number;
    abstract frames: Array<Frame>;
    abstract currentFrameIndex: number;
    abstract currentFrame: Frame;

    abstract roll(pins: number): void;

    registerFoul() {
        throw new GameError(`Not implemented`, {code: ERRORCODE.action_not_implemented});
    }
    registerDeadball() {
        throw new GameError(`Not implemented`, {code: ERRORCODE.action_not_implemented});
    }
    registerSplit() {
        throw new GameError(`Not implemented`, {code: ERRORCODE.action_not_implemented});
    }
}

export class ScoringTenpin extends Scoring {
    type = GameType.Tenpin;
    maxRoll = 10;
    maxFrames = 10;
    frames: Array<Frame> = [];
    currentFrameIndex = 0;
    currentFrame = new FrameTenpin(this.maxRoll);

    roll(pins: number = 0) {
        this.currentFrame.roll(pins);

        // Look behind to check for spares and strikes
        if (this.currentFrameIndex - 1 >= 0) {
            const prevFrame = this.frames[this.currentFrameIndex - 1];
            if (prevFrame.type === FrameType.Strike) {
                prevFrame.bonusPoints += pins;

                // Check for second Strike
                if (this.currentFrameIndex - 2 >= 0 && this.frames[this.currentFrameIndex - 2].type === FrameType.Strike) {
                    this.frames[this.currentFrameIndex - 2].bonusPoints += pins;
                }   
            }

            if (prevFrame.type === FrameType.Spare && this.currentFrame.rolls.length === 1) {
                // Increase previous Spare points only for the first roll of the current frame
                prevFrame.bonusPoints += pins;
            }
        }

        // Advance to the next frame when the current frame is not last and either condition is met:
        // - current roll was a strike
        // - current roll was the second of two rolls in the current frame
        if ( !this.currentFrame.isLast && (
                this.currentFrame.type === FrameType.Strike
                || this.currentFrame.rolls.length === 2
            ) ) {

            this.frames.push(this.currentFrame);

            this.currentFrameIndex++;

            if (this.currentFrameIndex <= this.maxFrames) {
                const isLastFrame = this.currentFrameIndex === this.maxFrames;
                this.currentFrame = new FrameTenpin(this.maxRoll, isLastFrame);
            } else { // this.currentFrameIndex > this.maxFrames
                // Impossible to play more than maxFrames
                throw new GameError(`No more frames to play`, {code: ERRORCODE.no_more_frames_available});
            }            
        }
    }
}