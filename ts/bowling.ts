import {GameError, GameRangeError, GameSetupError, ERRORCODE} from "./errors.js";
import {GameType} from './scoring.js';
import {PlayerInterface, Player} from './player.js';


export class BowlingGame {
    type: GameType = GameType.Tenpin;
    scoring_maxroll: number;
    scoring_maxframes: number;

    players: Map<string, PlayerInterface> = new Map();
    currentPlayer?: string;

    constructor(type: GameType) {
        if (type !== GameType.Tenpin) {
            throw new GameSetupError(`Scoring for "${type}" type is not implemented`, {code: ERRORCODE.scoring_not_implemented});
        }
        this.scoring_maxroll = 10;
        this.scoring_maxframes = 10;
    }

    addPlayerName(name: string, handicap?: number) {
        const player = new Player(name, handicap);
        this.addPlayer(player);
    }

    getPlayer(name: string): PlayerInterface | undefined {
        return this.players.get(name);
    }

    protected addPlayer(player: PlayerInterface) {
        this.players.set(player.name, player);
    }

    roll(name: string, pins: number = 0) {

        const player = this.getPlayer(name);
        if (player === undefined) {
            throw new GameError(`Player name "${name}" is not registrered for the game`, {code: ERRORCODE.player_not_found});
        }

        // TODO: Check if it is your turn?

        player.roll(pins);
    }

}

