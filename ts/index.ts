import { strict as assert } from 'node:assert';

import { BowlingGame } from "./bowling.js";
import { GameType } from './scoring.js';
import { ERRORCODE, GameSetupError, GameError, GameRangeError } from "./errors.js";

console.log("⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️ 🎳 ⭐️");

const Player1 = "The Dude";
const Player2 = "Donny";
const Player3 = "Sobchak";

// Should fail with a specific reason (scoring not implemented)
try {
    const game = new BowlingGame(GameType.Duckpin);
} catch (e) {
    if (e instanceof GameSetupError) assert(e.code === ERRORCODE.scoring_not_implemented);
    else throw e;
}
console.log("✅ scoring_not_implemented");

const game = new BowlingGame(GameType.Tenpin);
console.log("✅ new BowlingGame");

// Should fail with a specific reason (player not found)
try {
    game.roll("unknown", 10);
} catch (e) {
    if (e instanceof GameError) assert(e.code === ERRORCODE.player_not_found);
    else throw e;
}
console.log("✅ player_not_found");

game.addPlayerName(Player1);
game.addPlayerName(Player2);
game.addPlayerName(Player3);
console.log("✅ addPlayerName");

// Test roll_exceeds_max_pins
try { 
    game.roll(Player1, 11);
} catch (e) {
    if (e instanceof GameRangeError) assert(e.code === ERRORCODE.roll_exceeds_max_pins);
    else throw e;
}
console.log("✅ roll_exceeds_max_pins");

// Test score sheet 2
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

game.roll(Player1, 5);
game.roll(Player1, 2);
game.roll(Player1, 10);
game.roll(Player1, 0);
game.roll(Player1, 6);

game.roll(Player1, 2);
game.roll(Player1, 8);
game.roll(Player1, 10);

game.getPlayer(Player1)?.getScoringSheet();

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

// todo: test one more roll (should fail)