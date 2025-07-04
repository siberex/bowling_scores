import { strict as assert } from 'node:assert';

import { BowlingGame } from "./bowling.js";
import { GameType } from './scoring.js';
import { ERRORCODE, GameSetupError, GameError, GameRangeError } from "./errors.js";

const SEPARATOR = "⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️";
const PRINT_SHEETS = true;

const testRolls = (rolls: number[] = [], expectedTotal = 0, name = "test player", handicap = 0) => {
    const game = new BowlingGame(GameType.Tenpin);
    game.addPlayer(name, handicap);
    game.rollSeries(name, rolls);
    const scoring = game.getScoring(name);
    assert(scoring?.total === expectedTotal, `${name} got: ${scoring?.total}, expected: ${expectedTotal}`);
    if (PRINT_SHEETS) game.getPlayer(name)?.printScoringSheet();
}

const testRollsError = (errorCode: ERRORCODE, rolls: number[] = [], expectedTotal = 0, name = "test player", handicap = 0) => {
    try {
        testRolls(rolls, expectedTotal, name, handicap);
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
testRollsError(ERRORCODE.roll_is_negative, [5, 0, 3, 7, -4, 5], 0, Player1, 0);

// Test roll_exceeds_max_pins
testRollsError(ERRORCODE.roll_exceeds_max_pins, [11], 0, Player2, Player2Handicap);

// Test frame_exceeds_max_pins
testRollsError(ERRORCODE.frame_exceeds_max_pins, [5, 0, 3, 7, 6, 5], 0, Player3, 0);

// Test no_more_frames_available
testRollsError(ERRORCODE.no_more_frames_available, [10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 1], 0, Player1, 0);

// Test exposed properties and no_more_rolls_available
try {
    game.rollSeries(Player5, [0, 2, 10, 10, 1]);
    const testPlayer = game.getPlayer(Player5);
    testPlayer?.scoring.currentFrame.roll(6);
    assert(testPlayer?.scoring.frames.length === 3, `Expected 3 frames, got ${testPlayer?.scoring.frames.length}`);
    assert(testPlayer?.scoring.currentFrameIndex === 3, `Expecting current frame to be #4, got ${testPlayer?.scoring.currentFrameIndex + 1}`);
    testPlayer?.scoring.currentFrame.roll(0); // Should fail here
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
        testRolls(rolls, result, name, 0);
    } else if (PRINT_SHEETS) {
        console.log(SEPARATOR);
    }
});
console.log("✅ Game scoring and score sheets display");

// console.log("⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️");
// game.addPlayer("MIKE");
// game.rollSeries("MIKE", [10, 5, 1, 3, 3, 3, 4, 7, 2, 10, 10, 3, 3, 5, 1, 6, 3]);
// console.log(game.getScoring("MIKE"));
// game.getPlayer("MIKE")?.printScoringSheet();

console.log(SEPARATOR);


// Test intermediate scoring
game.rollSeries(Player1, [8, 1, 0, 9, 2, 8, 10, 6, 3, 7, 0]);
const scoringPartial = game.getPlayer(Player1)?.getScoringSheet();
assert(scoringPartial?.closed === false, `Expected partial scoring sheet not to be closed`);
assert(scoringPartial?.total === 73, `${Player1} got: ${scoringPartial?.total}, expected: 73`);
if (PRINT_SHEETS) game.getPlayer(Player1)?.printScoringSheet();

game.rollSeries(Player1, [5, 2, 10, 0, 6, 2, 8, 10]);
const scoringFinal = game.getPlayer(Player1)?.getScoringSheet();
assert(scoringFinal?.closed === true, `Expected final scoring sheet to be closed`);
assert(scoringFinal?.total === 122, `${Player1} got: ${scoringFinal?.total}, expected: 122`);
if (PRINT_SHEETS) game.getPlayer(Player1)?.printScoringSheet();
console.log("✅ Partial and final scoring and display");


// Test "Perfect game"
game.rollSeries(Player3, Array(12).fill(10));
const perfectScoring = game.getPlayer(Player3)?.getScoringSheet();
assert(perfectScoring?.closed === true, `Expected final scoring sheet to be closed`);
assert(perfectScoring?.total === 300, `${Player3} got: ${perfectScoring?.total}, expected: 300`);
if (PRINT_SHEETS) game.getPlayer(Player3)?.printScoringSheet();
console.log("✅ Perfect Game scoring and display");


// Test partial scoring amid frame and the final scoring with handicap
game.rollSeries(Player2, [2, 3, 4, 5, 10, 10, 0, 9, 8]);
const scoringPartialHandicap = game.getPlayer(Player2)?.getScoringSheet();
assert(scoringPartialHandicap?.total === 70, `${Player2} got: ${scoringPartialHandicap?.total}, expected: 70`);
if (PRINT_SHEETS) game.getPlayer(Player2)?.printScoringSheet();
game.rollSeries(Player2, [2, 0, 10, 1, 8, 7, 2, 5, 1]);
const scoringFinalHandicap = game.getPlayer(Player2)?.getScoringSheet();
assert(scoringFinalHandicap?.total === (107 + Player2Handicap), `${Player2} got: ${scoringFinalHandicap?.total}, expected: ${107 + Player2Handicap}`);
if (PRINT_SHEETS) game.getPlayer(Player2)?.printScoringSheet();
console.log("✅ Partial scoring amid frame and final scoring with the handicap");


// Test some more score sheets
console.log(SEPARATOR);

// Existing game instance
game.rollSeries(Player4, [1, 8, 10, 7, 0, 2, 8, 8, 1, 9, 0, 10, 10, 10, 6, 4, 3]);
const testScorePlayer4 = game.getPlayer(Player4)?.getScoringSheet().total;
assert(testScorePlayer4 === 158, `${Player4} got: ${testScorePlayer4}, expected: 158`)

// Isolated game instances
const TEST_SHEETS_MORE: Array<TestSheet | null> = [
    [Player4,       [1, 8, 10, 7, 0, 2, 8, 8, 1, 9, 0, 10, 10, 10, 6, 4, 3],        158],
    ["Dreamer",     [10, 6, 3, 0, 0, 9, 1, 5, 2, 8, 1, 10, 10, 1, 9, 10, 8, 2],     140],
    ["Dick Weber",  [0, 2, 10, 10, 10, 1, 6, 4, 2, 7, 3, 6, 3, 4, 6, 10, 10, 6],    154],
    null,
    ["John Doe",    [5, 5, 4, 5, 8, 2, 10, 0, 10, 10, 6, 2, 10, 4, 6, 10, 10, 0],   169],
    ["John Doe",    [5, 5, 4, 0, 8, 1, 10, 0, 10, 10, 10, 10, 4, 6, 10, 10, 5],     186],
    null,
    ["Brittany",    [10, 7, 3, 8, 1, 7, 3, 5, 0, 0, 6, 10, 10, 8, 0, 10, 10, 10],   157],
    ["Martyn",      [9, 1, 10, 10, 10, 7, 3, 10, 9, 1, 10, 10, 7, 2],               212],
    ["IBF",         [10, 10, 10, 7, 2, 8, 2, 0, 9, 10, 7, 3, 9, 0, 10, 10, 8],      180]
];

TEST_SHEETS_MORE.forEach((testSheet: TestSheet | null) => {
    if (testSheet !== null) {
        const [name, rolls, result] = testSheet;
        testRolls(rolls, result, name, 0);
    } else if (PRINT_SHEETS) {
        console.log(SEPARATOR);
    }
});

console.log("✅ Additional score sheets tests");
