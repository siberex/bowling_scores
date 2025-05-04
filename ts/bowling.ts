import {GameError, GameRangeError, GameSetupError, ERRORCODE} from "./errors.js";
import {GameType} from './scoring.js';
import {PlayerInterface, Player, ScoringSheet} from './player.js';


export class BowlingGame {
    type: GameType = GameType.Tenpin;
    scoring_maxroll: number;
    scoring_maxframes: number;

    players: Map<string, PlayerInterface> = new Map();
    protected _playersList: string[] = [];
    get playerList() {
        return [...this.players.keys()];
    }
    currentPlayer?: string;

    protected isStarted: boolean = false;
    protected isFinished: boolean = false;

    constructor(type: GameType) {
        if (type !== GameType.Tenpin) {
            throw new GameSetupError(`Scoring for "${type}" type is not implemented`, {code: ERRORCODE.scoring_not_implemented});
        }
        this.scoring_maxroll = 10;
        this.scoring_maxframes = 10;
    }

    // Should not be called except for debug purposes.
    // By design all operations should be done using the player name.
    getPlayer(name: string): PlayerInterface | undefined {
        return this.players.get(name);
    }

    getScoring(name: string): ScoringSheet | undefined {
        return this.players.get(name)?.getScoringSheet();
    }

    addPlayer(name: string, handicap: number = 0): PlayerInterface {
        if (name.length === 0) {
            throw new GameSetupError(`Empty player name`, {code: ERRORCODE.player_name_empty});
        }

        let player = this.players.get(name);

        if (player !== undefined) {
            // Check handicap value for existing platyer with the same name
            if (player.handicap !== handicap) {
                throw new GameSetupError(`Player already exists`, {code: ERRORCODE.player_already_exists});
            }
        } else {
            // Create new player
            // TODO: May be restrict adding new players if the game is started (at least one roll were made by any player)
            player = new Player(name, handicap);
            this.players.set(name, player);
        }
        return player;
    }

    roll(name: string, pins: number = 0): void {
        const player = this.getPlayer(name);
        if (player === undefined) {
            throw new GameError(`Player name "${name}" is not registrered in the game`, {code: ERRORCODE.player_not_found});
        }

        player.roll(pins);
    }

    rollTurn(name: string, pins: number = 0): void {
        // TODO: Check if it is your turn
        throw new GameError(`Not implemented`, {code: ERRORCODE.action_not_implemented});
    }

    // Mostly for testing purposes
    rollSeries(name: string, rolls: number[]): void {
        const player = this.getPlayer(name);
        if (player === undefined) {
            throw new GameError(`Player name "${name}" is not registrered in the game`, {code: ERRORCODE.player_not_found});
        }
        rolls.forEach(pins => player.roll(pins));
    }

}

