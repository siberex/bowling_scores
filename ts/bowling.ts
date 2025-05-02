import {GameError, GameRangeError, GameSetupError, ERRORCODE} from "./errors.js";



// https://en.wikipedia.org/wiki/Tenpin_bowling#Traditional_scoring
// https://en.wikipedia.org/wiki/Tenpin_bowling#World_Bowling_scoring
// https://en.wikipedia.org/wiki/Candlepin_bowling#Scoring
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
    // Split = "SPLIT", // headpin knocked down, but there are two or more non-adjacent (i.e. at least 1 pin apart) groups of pins left, highlighted red
    Gutter = "GUTTER", // no pins are hit (ball rolls into one of the gutters), marked "-"

    // Those are Game achievments, not frame types per se
    // Turkey = "TURKEY", // three strikes in a row, "🦃"
    // Double — two strikes in a row
    // Hambone or four-bagger — four strikes in a row
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
    // Valid examples: [10], [0, 0], [2, 8], [10, 10, 5]
    // Invalid examples: ...
    rolls: Array<number> = [];
}

class Player {
    _name: string;
    get name() {
        return this._name;
    }
    _handicap: number;
    get handicap() {
        return this._handicap;
    }

    protected currentFrame = 0;
    protected currentFrameStage = 0;

    constructor(name: string, handicap = 0) {
        this._name = name;
        this._handicap = handicap;
    }

    roll(pins: number = 0) {
        if (pins < 0) {
            throw new GameRangeError(`Negative knocked pins (${pins})`, {code: ERRORCODE.roll_is_negative});
        }

    }

    getScoringSheet() {

    }
}

class ScoringSheet {
    scratch: number = 0;
    handicap = 0;
    total = 0;
}

export class BowlingGame {
    type: GameType = GameType.Tenpin;
    scoring_maxroll: number;
    scoring_maxframes: number;

    players: Map<string, Player> = new Map();

    constructor(type: GameType) {
        if (type !== GameType.Tenpin) {
            throw new GameSetupError(`Scoring for "${type}" type is not implemented`, {code: ERRORCODE.scoring_not_implemented});
        }
        this.scoring_maxroll = 10;
        this.scoring_maxframes = 10;

    }

    addPlayerName(name: string) {
        const player = new Player(name);
        this.addPlayer(player);
    }

    getPlayer(name: string): Player | undefined {
        return this.players.get(name);
    }

    protected addPlayer(player: Player) {
        this.players.set(player.name, player);
    }

    roll(name: string, pins: number = 0) {
        if (pins > this.scoring_maxroll) {
            throw new GameRangeError(
                `Knocked pin count (${pins}) exceeds the maximum allowed number of pins (${this.scoring_maxroll})`,
                {code: ERRORCODE.roll_exceeds_max_pins}
            );
        }

        const player = this.getPlayer(name);
        if (player === undefined) {
            throw new GameError(`Player name "${name}" is not registrered for the game`, {code: ERRORCODE.player_not_found});
        }

        player.roll(pins);

    }


}

