import { strict as assert } from 'node:assert';

import { BowlingGame } from "./bowling.js";
import { GameType } from './scoring.js';
import { ERRORCODE, GameSetupError, GameError, GameRangeError } from "./errors.js";

const SEPARATOR = "⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️";
const PRINT_SHEETS = false;

const testRolls = (name = "test player", rolls: Array<number> = [], expectedTotal = 0, handicap = 0) => {
    const game = new BowlingGame(GameType.Tenpin);
    game.addPlayer(name, handicap);
    game.rollSeries(name, rolls);
    const scoring = game.getScoring(name);
    assert(scoring?.total === expectedTotal, `${name} got: ${scoring?.total}, expected: ${expectedTotal}`);
    if (PRINT_SHEETS) game.getPlayer(name)?.printScoringSheet();
}

const testRollsError = (errorCode: ERRORCODE, name = "test player", rolls: Array<number> = [], expectedTotal = 0, handicap = 0) => {
    try {
        testRolls(name, rolls, expectedTotal, handicap);
    } catch (e) {
        if (e instanceof GameError || e instanceof GameRangeError) assert(e.code === errorCode, `Expected error ${ERRORCODE[errorCode]}. Got: ${ERRORCODE[e.code]}`);
        else throw e;
        console.log(`✅ Asserted Error: ${ERRORCODE[errorCode]}`);
    }
}

const Player1 = "The Dude";
const Player2 = "Donny";
const Player2Handicap = 27;
const Player3 = "Sobchak";
const Player4 = "Quintana";
const Player5 = "Stranger";

console.log(SEPARATOR);

// Should fail with a scoring_not_implemented Error
try {
    const game = new BowlingGame(GameType.Duckpin);
} catch (e) {
    if (e instanceof GameSetupError) assert(e.code === ERRORCODE.scoring_not_implemented);
    else throw e;
    console.log("✅ Asserted Error: scoring_not_implemented");
}

const game = new BowlingGame(GameType.Tenpin);
console.log("✅ new BowlingGame");

// Should fail with a player_not_found Error
try {
    game.roll("unknown", 10);
} catch (e) {
    if (e instanceof GameError) assert(e.code === ERRORCODE.player_not_found);
    else throw e;
    console.log("✅ Asserted Error: player_not_found");
}

// Test player_name_empty
try {
    game.addPlayer("");
} catch(e) {
    if (e instanceof GameSetupError) assert(e.code === ERRORCODE.player_name_empty, `Expected error player_name_empty. Got: ${ERRORCODE[e.code]}`);
    else throw e;
    console.log("✅ Asserted Error: player_name_empty");
}

// Test wrong_handicap_value
try {
    game.addPlayer(Player5, -100);
} catch(e) {
    if (e instanceof GameRangeError) assert(e.code === ERRORCODE.wrong_handicap_value, `Expected error wrong_handicap_value. Got: ${ERRORCODE[e.code]}`);
    else throw e;
    console.log("✅ Asserted Error: wrong_handicap_value");
}

game.addPlayer(Player1);
game.addPlayer(Player2, Player2Handicap);
game.addPlayer(Player3);
game.addPlayer(Player4);

// Test player_already_exists
try {
    game.addPlayer(Player4, 100);
} catch (e) {
    if (e instanceof GameSetupError) assert(e.code === ERRORCODE.player_already_exists, `Expected error player_already_exists. Got: ${ERRORCODE[e.code]}`);
    else throw e;
    console.log("✅ Asserted Error: player_already_exists");
}

game.addPlayer(Player5, 100);
console.log("✅ addPlayer");

// Test roll_is_negative
testRollsError(ERRORCODE.roll_is_negative, Player1, [5, 0, 3, 7, -4, 5], 0, 0);

// Test roll_exceeds_max_pins
testRollsError(ERRORCODE.roll_exceeds_max_pins, Player2, [11], 0, Player2Handicap);

// Test frame_exceeds_max_pins
testRollsError(ERRORCODE.frame_exceeds_max_pins, Player3, [5, 0, 3, 7, 6, 5], 0, 0);

// Test no_more_frames_available
testRollsError(ERRORCODE.no_more_frames_available, Player1, [10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 1], 0, 0);

// Test no_more_rolls_available
try {
    game.rollSeries(Player5, [0, 2, 10, 10, 1]);
    const plr = game.getPlayer(Player5);
    plr?.scoring.currentFrame.roll(6);
    plr?.scoring.currentFrame.roll(0);
    throw new Error(`Test fixture error: Not getting no_more_rolls_available GameError`);
} catch (e) {
    if (e instanceof GameError) assert(e.code === ERRORCODE.no_more_rolls_available, `Expected error no_more_rolls_available. Got: ${ERRORCODE[e.code]}`);
    else throw e;
    console.log("✅ Asserted Error: no_more_rolls_available");
}


// Test score sheets
console.log(SEPARATOR);

type TestSheet = [string, number[], number];
const TEST_SHEETS: Array<TestSheet | null> = [
    ["LOZ",     [8, 1, 9, 1, 8, 1, 9, 0, 9, 0, 7, 0, 1, 8, 0, 3, 0, 7, 7, 0],       87],
    ["CRAIG",   [0, 9, 4, 3, 10, 8, 0, 8, 2, 6, 0, 1, 3, 0, 10, 7, 0, 7, 2],        101],
    ["PAUL",    [0, 8, 9, 0, 0, 0, 0, 7, 7, 0, 8, 0, 0, 0, 6, 3, 0, 0, 7, 0],       55],
    ["DOTTI",   [0, 7, 0, 0, 8 , 0, 10, 0, 3, 8, 0, 0, 0, 10, 1, 0, 0, 0],          51],
    ["ALEC",    [6, 4, 7, 2, 5, 4, 6, 4, 6, 1, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0],       64],
    ["IMO",     [1, 0, 0, 7, 2, 4, 0, 0, 0, 8, 3, 3, 2, 4, 0, 3, 0, 0, 0, 6],       43],
    null,
    ["LOZ",     [7, 2, 9, 1, 1, 7, 9, 1, 3, 3, 1, 6, 8, 1, 10, 9, 1, 7, 0],         107],
    ["CRAIG",   [1, 0, 9, 1, 10, 9, 0, 10, 7, 1, 4, 4, 9, 0, 8, 2, 7, 2],           118],
    ["PAUL",    [0, 7, 10, 7, 0, 8, 0, 8, 0, 8, 0, 9, 1, 8, 2, 8, 2, 1, 0],         103],
    ["DOTTI",   [3, 0, 1, 8, 10, 6, 4, 0, 8, 8, 0, 0, 4, 1, 1, 7, 0, 10, 0, 9],     90],
    ["ALEC",    [8, 0, 5, 4, 6, 0, 5, 0, 4, 1, 0, 0, 0, 5, 6, 0, 4, 0, 0, 0],       48],
    null,
    ["LUKE",    [6, 0, 3, 0, 3, 5, 3, 0, 6, 2, 1, 9, 6, 0, 9, 0, 7, 3, 3, 6],       81],
    ["LOCKY",   [7, 0, 3, 0, 1, 3, 6, 1, 5, 2, 2, 3, 5, 2, 6, 0, 1, 3, 1, 4],       55],
    ["CRAIG",   [7, 2, 1, 6, 7, 1, 10, 2, 7, 1, 7, 10, 7, 1, 4, 0, 1, 8],           99],
    ["PHIL",    [8, 0, 1, 6, 1, 7, 2, 4, 7, 2, 7, 3, 7, 1, 7, 0, 9, 1, 9, 1, 10],   109],
    ["JAMIE",   [0, 0, 8, 1, 8, 0, 5, 1, 6, 1, 8, 0, 1, 8, 8, 0, 7, 0, 4, 2],       68],
    null,
    ["LUKE",    [7, 2, 9, 0, 4, 3, 3, 7, 6, 2, 7, 0, 6, 3, 6, 1, 10, 7, 3, 2],      104],
    ["LOCKY",   [9, 1, 6, 2, 3, 6, 0, 3, 8, 0, 7, 2, 0, 3, 3, 3, 5, 3, 2, 4],       76],
    ["CRAIG",   [5, 2, 3, 7, 7, 0, 0, 10, 1, 4, 0, 9, 8, 2, 5, 5, 1, 9, 3, 3],      101],
    ["PHIL",    [7, 0, 5, 5, 3, 7, 10, 6, 1, 10, 1, 7, 10, 4, 5, 6, 0],             124],
    null,
    ["GERRY",   [3, 0, 8, 2, 8, 2, 5, 3, 9, 0, 4, 0, 8, 0, 8, 1, 7, 3, 7, 2],       100],
    ["BELLY",   [7, 1, 10, 0, 7, 8, 1, 1, 3, 7, 3, 0, 8, 8, 0, 7, 1, 10, 7, 1],     97],
    ["BEVO",    [8, 2, 10, 5, 3, 8, 1, 10, 9, 0, 10, 6, 4, 10, 3, 0],               139],
    ["FIONA",   [9, 0, 7, 2, 7, 0, 0, 2, 10, 3, 0, 5, 4, 9, 1, 9, 0, 10, 3, 6],     99],
    ["BRETT",   [9, 0, 9, 0, 0, 5, 5, 3, 10, 6, 1, 6, 1, 7, 2, 3, 6, 6, 3],         89],
    ["KAYLA",   [0, 0, 6, 2, 8, 2, 5, 3, 7, 0, 7, 1, 3, 3, 6, 0, 3, 6, 9, 0],       76],
    null,
    ["GERRY",   [1, 9, 7, 1, 6, 0, 3, 3, 6, 4, 3, 3, 6, 0, 8, 1, 8, 0, 7, 1],       87],
    ["BELLY",   [3, 4, 3, 0, 7, 2, 0, 3, 10, 3, 7, 8, 0, 10, 3, 0, 9, 0],           93],
    ["BEVO",    [7, 1, 1, 8, 5, 4, 6, 4, 8, 0, 9, 1, 9, 0, 10, 10, 9, 1, 7],        146],
    ["FIONA",   [9, 0, 0, 10, 6, 3, 9, 1, 1, 8, 7, 2, 3, 4, 6, 0, 10, 4, 6, 7],     113],
    ["BRETT",   [9, 0, 9, 0, 7, 0, 8, 1, 0, 6, 5, 1, 6, 0, 7, 1, 7, 0, 5, 5, 8],    85],
    ["KAYLA",   [5, 2, 5, 0, 3, 5, 9, 0, 4, 1, 1, 0, 7, 1, 7, 0, 1, 9, 4, 2],       70],
    null,
    ["TOM",     [0, 1, 7, 2, 3, 6, 1, 8, 6, 0, 8, 1, 8, 0, 9, 0, 1, 8, 7, 3, 10],   89],
    ["MIKE",    [7, 0, 8, 2, 8, 2, 9, 0, 4, 5, 3, 7, 5, 4, 10, 4, 1, 9, 1, 9],      125],
    ["SMEL",    [5, 5, 9, 1, 7 , 0, 8, 2, 7, 2, 7, 0, 6, 3, 8, 2, 4, 5, 5, 2],      115],
    ["GRACE",   [6, 4, 5, 1, 9, 1, 6, 0, 3, 5, 3, 4, 10, 4, 1, 10, 3, 3],           100],
    ["AIDEN",   [6, 0, 3, 6, 10, 10, 8, 0, 10, 9, 0, 10, 8, 0, 1, 7],               131],
    null,
    ["TOM",     [7, 2, 6, 0, 5, 5, 8, 1, 4, 5, 7, 2, 6, 0, 4, 0, 9, 1, 3, 7, 6],    99],
    ["MIKE",    [10, 5, 1, 3, 3, 3, 4, 7, 2, 10, 10, 3, 3, 5, 1, 6, 3],             104],
    ["SMEL",    [1, 4, 4, 0, 7, 2, 5, 0, 7, 2, 8, 1, 3, 6, 10, 3, 6, 5, 0],         83],
    ["GRACE",   [10, 6, 4, 4, 1, 3, 5, 1, 8, 10, 1, 7, 7, 0, 3, 4, 4, 5],           105],
    ["AIDEN",   [4, 0, 8, 0, 7, 0, 5, 0, 10, 8, 0, 7, 2, 5, 0, 9, 0, 6, 2],         81],
    null,
    ["DH",      [10, 8, 2, 9, 1, 8, 0, 10, 10, 9, 1, 9, 1, 10, 10, 9, 1],   202],
    ["DT",      [7, 3, 10, 10, 8, 1, 9, 1, 8, 1, 10, 9, 1, 8, 2, 6, 1],     164],
    ["DC",      [10, 10, 10, 10, 10, 10, 10, 10, 6, 4, 10, 10, 10],         276], // Octopus
];

TEST_SHEETS.forEach((testSheet: TestSheet | null) => {
    if (testSheet !== null) {
        const [name, rolls, result] = testSheet;
        testRolls(name, rolls, result, 0);
    } else if (PRINT_SHEETS) {
        console.log(SEPARATOR);
    }
});
console.log("✅ Game scoring and score sheets display");


// console.log("⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️");
// game.addPlayer("MIKE");
// [10, 5, 1, 3, 3, 3, 4, 7, 2, 10, 10, 3, 3, 5, 1, 6, 3].forEach(r => game.roll("MIKE", r));
// console.log(game.getScoring("MIKE"));
// game.getPlayer("MIKE")?.printScoringSheet();

console.log(SEPARATOR);




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
// TODO: test intermediate score
game.getPlayer(Player1)?.printScoringSheet(); // assert 73
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
