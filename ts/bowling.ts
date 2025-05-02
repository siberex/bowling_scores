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
    Open = "OPEN",
    Strike = "STRIKE",
    Spare = "SPARE",
    Split = "SPLIT",
    Gutter = "GUTTER",
};

class Frame {
    type: FrameType = FrameType.Open;
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
    players: Map<string, Player> = new Map();

    constructor(type: GameType) {
        if (type !== GameType.Tenpin) {
            throw new GameSetupError(`Scoring for "${type}" type is not implemented`, {code: ERRORCODE.scoring_not_implemented});
        }
        this.scoring_maxroll = 10;

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

