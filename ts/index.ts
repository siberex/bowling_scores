import { strict as assert } from 'node:assert';

import { BowlingGame } from "./bowling.js";
import { GameType } from './scoring.js';
import { ERRORCODE, GameSetupError, GameError, GameRangeError } from "./errors.js";

const testRolls = (name = "test player", rolls: Array<number> = [], expectedTotal = 0, handicap = 0) => {
    const game = new BowlingGame(GameType.Tenpin);
    game.addPlayerName(name, handicap);
    rolls.forEach(r => game.roll(name, r));
    const scoring = game.getScoring(name);
    assert(scoring?.total === expectedTotal, `${name} got: ${scoring?.total}, expected: ${expectedTotal}`);
    game.getPlayer(name)?.printScoringSheet();
}

const testRollsError = (errorCode: ERRORCODE, name = "test player", rolls: Array<number> = [], expectedTotal = 0, handicap = 0) => {
    try {
        testRolls(name, rolls, expectedTotal, handicap);
    } catch (e) {
        if (e instanceof GameError || e instanceof GameRangeError) assert(e.code === errorCode, `Expected error ${ERRORCODE[errorCode]}. Got: ${ERRORCODE[e.code]}`);
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
type TestSheet = [string, number[], number];
const TEST_SHEETS: Array<TestSheet> = [
    ["LOZ",     [8, 1, 9, 1, 8, 1, 9, 0, 9, 0, 7, 0, 1, 8, 0, 3, 0, 7, 7, 0],       87],
    ["CRAIG",   [0, 9, 4, 3, 10, 8, 0, 8, 2, 6, 0, 1, 3, 0, 10, 7, 0, 7, 2],        101],
    ["PAUL",    [0, 8, 9, 0, 0, 0, 0, 7, 7, 0, 8, 0, 0, 0, 6, 3, 0, 0, 7, 0],       55],
    ["DOTTI",   [0, 7, 0, 0, 8 , 0, 10, 0, 3, 8, 0, 0, 0, 10, 1, 0, 0, 0],          51],
    ["ALEC",    [6, 4, 7, 2, 5, 4, 6, 4, 6, 1, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0],       64],
    ["IMO",     [1, 0, 0, 7, 2, 4, 0, 0, 0, 8, 3, 3, 2, 4, 0, 3, 0, 0, 0, 6],       43],

    ["LOZ",     [7, 2, 9, 1, 1, 7, 9, 1, 3, 3, 1, 6, 8, 1, 10, 9, 1, 7, 0],         107],
    ["CRAIG",   [1, 0, 9, 1, 10, 9, 0, 10, 7, 1, 4, 4, 9, 0, 8, 2, 7, 2],           118],
    ["PAUL",    [0, 7, 10, 7, 0, 8, 0, 8, 0, 8, 0, 9, 1, 8, 2, 8, 2, 1, 0],         103],
    ["DOTTI",   [3, 0, 1, 8, 10, 6, 4, 0, 8, 8, 0, 0, 4, 1, 1, 7, 0, 10, 0, 9],     90],
    ["ALEC",    [8, 0, 5, 4, 6, 0, 5, 0, 4, 1, 0, 0, 0, 5, 6, 0, 4, 0, 0, 0],       48],

    ["LUKE",    [6, 0, 3, 0, 3, 5, 3, 0, 6, 2, 1, 9, 6, 0, 9, 0, 7, 3, 3, 6],       81],
    ["LOCKY",   [7, 0, 3, 0, 1, 3, 6, 1, 5, 2, 2, 3, 5, 2, 6, 0, 1, 3, 1, 4],       55],
    ["CRAIG",   [7, 2, 1, 6, 7, 1, 10, 2, 7, 1, 7, 10, 7, 1, 4, 0, 1, 8],           99],
    ["PHIL",    [8, 0, 1, 6, 1, 7, 2, 4, 7, 2, 7, 3, 7, 1, 7, 0, 9, 1, 9, 1, 10],   109],
    ["JAMIE",   [0, 0, 8, 1, 8, 0, 5, 1, 6, 1, 8, 0, 1, 8, 8, 0, 7, 0, 4, 2],       68],

    ["LUKE",    [7, 2, 9, 0, 4, 3, 3, 7, 6, 2, 7, 0, 6, 3, 6, 1, 10, 7, 3, 2],      104],
    ["LOCKY",   [9, 1, 6, 2, 3, 6, 0, 3, 8, 0, 7, 2, 0, 3, 3, 3, 5, 3, 2, 4],       76],
    ["CRAIG",   [5, 2, 3, 7, 7, 0, 0, 10, 1, 4, 0, 9, 8, 2, 5, 5, 1, 9, 3, 3],      101],
    ["PHIL",    [7, 0, 5, 5, 3, 7, 10, 6, 1, 10, 1, 7, 10, 4, 5, 6, 0],             124],

];

TEST_SHEETS.forEach(testSheet => {
    const [name, rolls, result] = testSheet;
    testRolls(name, rolls, result, 0);
});

// ...
// TODO
// ...
// testRolls(Player1, [...]);

// console.log("⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️");
// game.addPlayerName("LOZ");
// [8, 1, 9, 1, 8, 1, 9, 0, 9, 0, 7, 0, 1, 8, 0, 3, 0, 7, 7, 0].forEach(r => game.roll("LOZ", r));
// console.log(game.getScoring("LOZ"));


console.log("⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️");

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
