"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterAction = exports.ActionManager = void 0;
const move_1 = require("../base_game_classes/character_actions/move");
const eat_1 = require("../base_game_classes/character_actions/eat");
const cook_meat_1 = require("../base_game_classes/character_actions/cook_meat");
const clean_1 = require("../base_game_classes/character_actions/clean");
const rest_1 = require("../base_game_classes/character_actions/rest");
const hunt_1 = require("../base_game_classes/character_actions/hunt");
const attack_1 = require("../base_game_classes/character_actions/attack");
const craft_spear_1 = require("../base_game_classes/character_actions/craft_spear");
const gather_wood_1 = require("../base_game_classes/character_actions/gather_wood");
const craft_bone_spear_1 = require("../base_game_classes/character_actions/craft_bone_spear");
const craft_rat_armour_1 = require("../base_game_classes/character_actions/craft_rat_armour");
class ActionManager {
    constructor(world, pool) {
        this.pool = pool;
        this.world = world;
        this.actions = [];
        this.add_action(move_1.move);
        this.add_action(clean_1.clean);
        this.add_action(cook_meat_1.cook_meat);
        this.add_action(eat_1.eat);
        this.add_action(hunt_1.hunt);
        this.add_action(rest_1.rest);
        this.add_action(attack_1.attack);
        this.add_action(craft_spear_1.craft_spear);
        this.add_action(gather_wood_1.gather_wood);
        this.add_action(craft_bone_spear_1.craft_bone_spear);
        this.add_action(craft_rat_armour_1.craft_rat_pants);
        this.add_action(craft_rat_armour_1.craft_rat_armour);
        this.add_action(craft_rat_armour_1.craft_rat_gloves);
        this.add_action(craft_rat_armour_1.craft_rat_helmet);
        this.add_action(craft_rat_armour_1.craft_rat_boots);
    }
    add_action(action) {
        this.actions.push(action);
    }
    async start_action(action_id, char, data) {
        if (char.action_started) {
            return 5 /* CharacterActionResponce.ALREADY_IN_ACTION */;
        }
        let action = this.actions[action_id];
        let check = await action.check(this.pool, char, data);
        if (check == 1 /* CharacterActionResponce.OK */) {
            let duration = action.duration(char);
            char.send_action_ping(duration, action.is_move || false);
            if (action.immediate) {
                await this.action(action_id, char, undefined);
            }
            else {
                await action.start(this.pool, char, data);
                char.action_started = true;
                char.current_action = action_id;
                char.action_progress = 0;
                char.action_duration = duration;
            }
        }
        return check;
    }
    async action(action_id, char, data) {
        let action = this.actions[action_id];
        char.action_started = false;
        let check = await action.check(this.pool, char, data);
        if (check == 1 /* CharacterActionResponce.OK */) {
            return await action.result(this.pool, char, data);
        }
        return check;
    }
}
exports.ActionManager = ActionManager;
var CharacterAction;
(function (CharacterAction) {
    CharacterAction[CharacterAction["MOVE"] = 0] = "MOVE";
    CharacterAction[CharacterAction["CLEAN"] = 1] = "CLEAN";
    CharacterAction[CharacterAction["COOK_MEAT"] = 2] = "COOK_MEAT";
    CharacterAction[CharacterAction["EAT"] = 3] = "EAT";
    CharacterAction[CharacterAction["HUNT"] = 4] = "HUNT";
    CharacterAction[CharacterAction["REST"] = 5] = "REST";
    CharacterAction[CharacterAction["ATTACK"] = 6] = "ATTACK";
    CharacterAction[CharacterAction["CRAFT_SPEAR"] = 7] = "CRAFT_SPEAR";
    CharacterAction[CharacterAction["GATHER_WOOD"] = 8] = "GATHER_WOOD";
    CharacterAction[CharacterAction["CRAFT_BONE_SPEAR"] = 9] = "CRAFT_BONE_SPEAR";
    CharacterAction[CharacterAction["CRAFT_RAT_PANTS"] = 10] = "CRAFT_RAT_PANTS";
    CharacterAction[CharacterAction["CRAFT_RAT_ARMOUR"] = 11] = "CRAFT_RAT_ARMOUR";
    CharacterAction[CharacterAction["CRAFT_RAT_GLOVES"] = 12] = "CRAFT_RAT_GLOVES";
    CharacterAction[CharacterAction["CRAFT_RAT_HELMET"] = 13] = "CRAFT_RAT_HELMET";
    CharacterAction[CharacterAction["CRAFT_RAT_BOOTS"] = 14] = "CRAFT_RAT_BOOTS";
})(CharacterAction = exports.CharacterAction || (exports.CharacterAction = {}));