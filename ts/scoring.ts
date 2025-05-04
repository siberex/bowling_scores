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

export const enum FrameType {
    Open = "OPEN", // frame is currently in play
    Strike = "STRIKE", // player knocked down all the pins with the first roll, marked "X"
    Spare = "SPARE", // player knocked down all the pins during two turns, marked "/"
    Gutter = "GUTTER", // no pins were knocked down during two turns (balls rolled into the gutters), marked "-"
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
    }

    isRollAllowed(): boolean {
        return true;
    }

    roll(score = 0) {
        this.verifyScore(score);
        if (this.isRollAllowed()) this.rolls.push(score);
        // ...
    }
}

class FrameTenpin extends Frame {

    verifyScore(score: number) {
        super.verifyScore(score);

        // Additional checks specific to the tenpin scoring
        if (this.rolls.length > 0) {
            const prevRoll =  this.rolls.at(-1) ?? 0;

            // Second roll knocked more pins than possible
            if (!this.isLast && (score + prevRoll) > this.maxRoll) {
                throw new GameRangeError(
                    `Frame score (${prevRoll} + ${score}) exceeds the maximum allowed number (${this.maxRoll})`,
                    {code: ERRORCODE.frame_exceeds_max_pins, pins: (prevRoll + score)}
                );
            }

            // Last frame
            if (this.isLast) {
                // Scenarios to mitigate:
                // Third roll knocked more pins than possible after a first-roll strike, except when there were consequent second-roll strike
                if ( this.type === FrameType.Strike
                     && this.rolls.length === 2
                     && this.rolls[1] !== this.maxRoll
                     && (score + prevRoll) > this.maxRoll ) {
                    throw new GameRangeError(
                        `Last frame score (${prevRoll} + ${score}) exceeds the maximum allowed number (${this.maxRoll})`,
                        {code: ERRORCODE.frame_exceeds_max_pins, pins: (prevRoll + score)}
                    );
                }

                // Second roll knocked more pins than possible (without a prior strike)
                if ( this.type !== FrameType.Strike
                     && this.rolls.length === 1
                     && (score + prevRoll) > this.maxRoll ) {
                    throw new GameRangeError(
                        `Last frame second roll score (${prevRoll} + ${score}) exceeds the maximum allowed number (${this.maxRoll})`,
                        {code: ERRORCODE.frame_exceeds_max_pins, pins: (prevRoll + score)}
                    );
                }
            }
        }
    }

    // Check it roll is allowed in this frame
    isRollAllowed(): boolean {
        // First roll in a frame, always allowed
        if (this.rolls.length === 0) return true;

        // Second roll
        // Not allowed after the strike (except for the last frame)
        if (this.rolls.length === 1 && (this.rolls[0] !== this.maxRoll || this.isLast)) return true;

        // Third roll is only allowed in the last frame and only after the spare or strike
        if ( this.rolls.length === 2 && this.isLast && (
            this.rolls[0] === this.maxRoll // strike
            || (this.rolls[0] + this.rolls[1]) === this.maxRoll // spare
        ) ) return true;

        return false;
    }

    roll(score = 0) {
        if (!this.isRollAllowed()) {
            throw new GameError(`No more rolls available`, {code: ERRORCODE.no_more_rolls_available});    
        }

        this.verifyScore(score);

        let displayScore = score > 0 ? score.toString() : "-";

        // Strike
        if (score === this.maxRoll) {
            if (this.rolls.length === 0) this.type = FrameType.Strike;
            displayScore = "X";
        }

        if (this.rolls.length > 0) {
            const prevRoll = this.rolls.at(-1) ?? 0;

            // Spare
            if (score + prevRoll === this.maxRoll) {
                if (this.rolls.length === 1) this.type = FrameType.Spare;
                displayScore = "/";
            }

            // Gutter
            if (this.rolls.length === 1 && prevRoll === 0 && score === 0) {
                this.type = FrameType.Gutter;
            }
        }

        this.rolls.push(score);
        this.displayRolls.push(displayScore);        
    }
}


export interface ScoringInterface {
    type: GameType;
    frames: Array<Frame>;
    currentFrame: Frame;
    currentFrameIndex: number;
    closed: boolean;
    roll(pins: number): void;
}

// There should be at least one absolutely useless abstraction
abstract class Scoring implements ScoringInterface {
    abstract readonly type: GameType;
    abstract readonly maxRoll: number;
    abstract readonly maxFrames: number;
    abstract frames: Array<Frame>;
    abstract currentFrame: Frame;
    abstract currentFrameIndex: number;
    abstract closed: boolean;

    abstract roll(pins: number): void;

    // Any roll can be marked as a Foul.
    // Foul registered right away if player does not release the ball within 30s timeout.
    // Foul registered retroactively (after the roll): player’s body touches or crosses beyond the foul line and touches any part of the lane.
    // Scoresheet mark: "F"
    registerFoul() {
        throw new GameError(`Not implemented`, {code: ERRORCODE.action_not_implemented});
    }


    // Split is marked retroactively after the roll by observing standing pins.
    // Split happens when headpin knocked down, but there are two or more non-adjacent (i.e. at least 1-pin apart) pin groups left standing on deck.
    // Scoresheet mark: Roll score number highlighted in red or printed within a circle.
    registerSplit() {
        throw new GameError(`Not implemented`, {code: ERRORCODE.action_not_implemented});
    }

    // Those are some named Score achievments:
    // Turkey: three strikes in a row
    // Hambone or Llama or Four-Bagger: four strikes in a row
    // Brat: five strikes in a row
    // Wild Turkey or six-pack = 6X
    // Front seven = 7X
    // Octopus = 8X
    // Golden Turkey = 9X
    // Front Ten = 10X
    // Front eleven = 11X
    // Dinosaur = 12X (A Perfect Game)

    // See Also: https://en.wikipedia.org/wiki/Dutch_200 
    // See Also: http://www.balmoralsoftware.com/bowling/bowling.htm    
}

export class ScoringTenpin extends Scoring {
    type = GameType.Tenpin;
    closed: boolean = false;
    maxRoll = 10;
    maxFrames = 10;
    frames: Array<Frame> = [];
    currentFrameIndex = 0;
    currentFrame = new FrameTenpin(this.maxRoll);

    roll(pins: number = 0): void {
        if (this.closed) {
            throw new GameError(`Scoresheet is closed, no more rolls`, {code: ERRORCODE.no_more_frames_available});
        }

        this.currentFrame.roll(pins);

        // Look behind to check for Spares and Strikes
        if (this.currentFrameIndex - 1 >= 0) {
            const prevFrame = this.frames[this.currentFrameIndex - 1];
            if (prevFrame.type === FrameType.Strike) {
                // Only the first two rolls from the last frame should count towards the previous Strike bonus points
                if (!this.currentFrame.isLast || this.currentFrame.rolls.length < 3) {
                    prevFrame.bonusPoints += pins;
                }

                // Check for the second Strike
                if (this.currentFrameIndex - 2 >= 0 && this.frames[this.currentFrameIndex - 2].type === FrameType.Strike) {
                    // Only the first roll from any current frame is counted towards the pre-previous Strike bonus points
                    if (this.currentFrame.rolls.length === 1) {
                        this.frames[this.currentFrameIndex - 2].bonusPoints += pins;
                    }
                }
            }

            // Increase previous Spare points only for the first roll of the current frame
            if (prevFrame.type === FrameType.Spare && this.currentFrame.rolls.length === 1) {
                prevFrame.bonusPoints += pins;
            }
        }

        // Advance to the next frame when the current frame is not the last one and either condition is met:
        // - current roll was a strike
        // - current roll was the second of two rolls in the current frame
        if ( !this.currentFrame.isLast && (
                this.currentFrame.type === FrameType.Strike
                || this.currentFrame.rolls.length === 2
            ) ) {

            this.frames.push(this.currentFrame);

            this.currentFrameIndex++;

            if (this.currentFrameIndex < this.maxFrames) {
                const isLastFrame = (this.currentFrameIndex === this.maxFrames - 1);
                this.currentFrame = new FrameTenpin(this.maxRoll, isLastFrame);
            } else { // this.currentFrameIndex >= this.maxFrames
                // Impossible to play more than maxFrames
                throw new GameError(`No more frames to play`, {code: ERRORCODE.no_more_frames_available});
            }            
        }

        // Last roll of the last frame: close the scoring sheet and push the last frame.
        // It will be the third roll if there were Strike or Spare in the last frame.
        // Or the second roll otherwise (i.e. when the last frame consists of two regular rolls).
        if ( this.currentFrame.isLast ) {
            if (
                ((this.currentFrame.type === FrameType.Strike || this.currentFrame.type === FrameType.Spare) && this.currentFrame.rolls.length === 3)
                || 
                ((this.currentFrame.type === FrameType.Open || this.currentFrame.type === FrameType.Gutter) && this.currentFrame.rolls.length === 2)
            ) {
                this.frames.push(this.currentFrame);
                this.closed = true;
            }
        }
    }
}
