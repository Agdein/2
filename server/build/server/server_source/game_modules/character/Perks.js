"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.can_shoot = exports.can_cast_magic_bolt = exports.can_push_back = exports.can_fast_attack = exports.can_dodge = exports.perk_requirement = exports.perk_price = exports.perks_list = void 0;
const materials_manager_1 = require("../manager_classes/materials_manager");
const data_1 = require("../data");
exports.perks_list = ['meat_master', 'advanced_unarmed', 'advanced_polearm', 'mage_initiation', 'magic_bolt', 'fletcher', 'skin_armour_master', 'blood_mage'];
function perk_base_price(tag) {
    switch (tag) {
        case 'meat_master': return 100;
        case 'advanced_unarmed': return 200;
        case 'advanced_polearm': return 200;
        case 'mage_initiation': return 1000;
        case 'blood_mage': return 1000;
        case 'magic_bolt': return 100;
        case 'fletcher': return 200;
        case 'skin_armour_master': return 1000;
    }
}
function perk_price(tag, student, teacher) {
    let price = perk_base_price(tag);
    if (data_1.Data.Reputation.a_X_b(teacher.id, 'enemy', student.id))
        price = price * 10;
    if (!data_1.Data.Reputation.a_X_b(teacher.id, 'friend', student.id))
        price = price * 1.5;
    if (!data_1.Data.Reputation.a_X_b(teacher.id, 'member', student.id))
        price = price * 1.5;
    return Math.round(price);
}
exports.perk_price = perk_price;
function perk_requirement(tag, character) {
    switch (tag) {
        case 'meat_master': {
            if (character.skills.cooking < 15) {
                return 'not_enough_cooking_skill_15';
            }
            return 'ok';
        }
        case 'fletcher': {
            if (character.skills.woodwork < 15) {
                return 'not_enough_woodwork_skill_15';
            }
            return 'ok';
        }
        case 'advanced_unarmed': {
            if (character.skills.noweapon < 15) {
                return 'not_enough_unarmed_skill_15';
            }
            return 'ok';
        }
        case 'advanced_polearm': {
            if (character.skills.polearms < 15) {
                return 'not_enough_polearms_skill_15';
            }
            return 'ok';
        }
        case 'mage_initiation': {
            if (character.skills.magic_mastery < 15) {
                return 'not_enough_magic_skill_15';
            }
            return 'ok';
        }
        case 'magic_bolt': {
            if (!character.perks.mage_initiation) {
                return 'not_initiated';
            }
            if (character.skills.magic_mastery < 15) {
                return 'not_enough_magic_skill_15';
            }
            return 'ok';
        }
        case 'blood_mage': {
            if (!character.perks.mage_initiation) {
                return 'not_initiated';
            }
            if (character.skills.magic_mastery < 30) {
                return 'not_enough_magic_skill_30';
            }
            return 'ok';
        }
        case 'skin_armour_master': {
            if (character.skills.clothier < 15) {
                return 'not_enough_clothier_skill_15';
            }
        }
    }
}
exports.perk_requirement = perk_requirement;
function weapon_type(weapon) {
    if (weapon == undefined) {
        return 'noweapon';
    }
    return weapon.weapon_tag;
}
function can_dodge(character) {
    if (character.perks.advanced_unarmed == true) {
        if (weapon_type(character.equip.data.weapon) == 'noweapon') {
            return true;
        }
    }
    if (character.perks.dodge == true) {
        return true;
    }
    return false;
}
exports.can_dodge = can_dodge;
function can_fast_attack(character) {
    if (character.perks.advanced_unarmed == true) {
        if (weapon_type(character.equip.data.weapon) == 'noweapon') {
            return true;
        }
    }
    return false;
}
exports.can_fast_attack = can_fast_attack;
function can_push_back(character) {
    if (character.perks.advanced_polearm == true) {
        if (weapon_type(character.equip.data.weapon) == "polearms" /* WEAPON_TYPE.POLEARMS */) {
            return true;
        }
    }
    return false;
}
exports.can_push_back = can_push_back;
function can_cast_magic_bolt(character) {
    if (character.perks.magic_bolt) {
        return true;
    }
    if (character.stash.get(materials_manager_1.ZAZ) > 0) {
        return true;
    }
    return false;
}
exports.can_cast_magic_bolt = can_cast_magic_bolt;
function can_shoot(character) {
    if (character.equip.data.weapon == undefined) {
        return false;
    }
    if (character.equip.data.weapon.weapon_tag != 'ranged') {
        return false;
    }
    if (character.stash.get(materials_manager_1.ARROW_BONE) >= 1) {
        return true;
    }
    return false;
}
exports.can_shoot = can_shoot;