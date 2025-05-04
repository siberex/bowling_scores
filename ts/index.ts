import { strict as assert } from 'node:assert';

import { BowlingGame } from "./bowling.js";
import { GameType } from './scoring.js';
import { ERRORCODE, GameSetupError, GameError, GameRangeError } from "./errors.js";

const testRolls = (name = "test player", rolls: Array<number> = [], expectedTotal = 0, handicap = 0) => {
    const game = new BowlingGame(GameType.Tenpin);
    game.addPlayerName(name, handicap);
    rolls.forEach(r => game.roll(name, r));
    const scoring = game.getScoring(name);
    assert(scoring?.total === expectedTotal);
    game.getPlayer(name)?.printScoringSheet();
}

const testRollsError = (errorCode: ERRORCODE, name = "test player", rolls: Array<number> = [], expectedTotal = 0, handicap = 0) => {
    try {
        testRolls(name, rolls, expectedTotal, handicap);
    } catch (e) {
        if (e instanceof GameError || e instanceof GameRangeError) assert(e.code === errorCode);
        else throw e;
    }

    console.log(`✅ Asserted Error: ${ERRORCODE[errorCode]}`);
}



console.log("⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️");

const Player1 = "The Dude";
const Player2 = "Donny";
const Player3 = "Sobchak";
const Player2Handicap = 10;

// Should fail with a scoring_not_implemented Error
try {
    const game = new BowlingGame(GameType.Duckpin);
} catch (e) {
    if (e instanceof GameSetupError) assert(e.code === ERRORCODE.scoring_not_implemented);
    else throw e;
}
console.log("✅ Asserted Error: scoring_not_implemented");

const game = new BowlingGame(GameType.Tenpin);
console.log("✅ new BowlingGame");

// Should fail with a player_not_found Error
try {
    game.roll("unknown", 10);
} catch (e) {
    if (e instanceof GameError) assert(e.code === ERRORCODE.player_not_found);
    else throw e;
}
console.log("✅ Asserted Error: player_not_found");

game.addPlayerName(Player1);
game.addPlayerName(Player2, Player2Handicap);
game.addPlayerName(Player3);
console.log("✅ addPlayerName");

// Test roll_exceeds_max_pins
testRollsError(ERRORCODE.roll_exceeds_max_pins, Player2, [11], 0, Player2Handicap);

// Test frame_exceeds_max_pins
testRollsError(ERRORCODE.frame_exceeds_max_pins, Player3, [5, 0, 3, 7, 6, 5], 0, 0);

// Test no_more_frames_available
testRollsError(ERRORCODE.no_more_frames_available, Player1, [10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 1], 0, 0);

// Test score sheets
// ...
// TODO
// ...
// testRolls(Player1, [...]);

game.roll(Player1, 8);
game.roll(Player1, 1);
game.roll(Player1, 0);
game.roll(Player1, 9);
game.roll(Player1, 2);
game.roll(Player1, 8);

game.roll(Player1, 10);
game.roll(Player1, 6);
game.roll(Player1, 3);
game.roll(Player1, 7);
game.roll(Player1, 0);
game.getPlayer(Player1)?.printScoringSheet();
game.roll(Player1, 5);
game.roll(Player1, 2);
game.roll(Player1, 10);
game.roll(Player1, 0);
game.roll(Player1, 6);

game.roll(Player1, 2);
game.roll(Player1, 8);
game.roll(Player1, 10);

// TODO: test exposed properties?
// console.log(game.getPlayer(Player1)?.scoring.currentFrame);
// console.log(game.getPlayer(Player1)?.scoring.frames.length);

game.getPlayer(Player1)?.printScoringSheet();

// todo: test one more roll (should fail)

// final score should be 122

game.roll(Player3, 10);
game.roll(Player3, 10);
game.roll(Player3, 10);

game.roll(Player3, 10);
game.roll(Player3, 10);
game.roll(Player3, 10);

game.roll(Player3, 10);
game.roll(Player3, 10);
game.roll(Player3, 10);

game.roll(Player3, 10);
game.roll(Player3, 10);
game.roll(Player3, 10);

game.getPlayer(Player3)?.getScoringSheet();
game.getPlayer(Player3)?.printScoringSheet();
