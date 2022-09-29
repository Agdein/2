"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rest = void 0;
exports.rest = {
    duration(char) {
        return 0.1 + char.get_fatigue() / 20;
    },
    check: function (char, data) {
        if (!char.in_battle()) {
            const cell = Convert.character_to_cell(char)
            if (cell == undefined) {
                return 6 /* CharacterActionResponce.INVALID_CELL */;
            }
            if (char.misc.tag == 'rat') {
                return 1 /* CharacterActionResponce.OK */;
            }
            if (cell.can_rest()) {
                return 1 /* CharacterActionResponce.OK */;
            }
            if (char.get_fatigue() < 40) {
                return 3 /* CharacterActionResponce.NO_RESOURCE */;
            }
            return 1 /* CharacterActionResponce.OK */;
        }
        return 2 /* CharacterActionResponce.IN_BATTLE */;
    },
    result: function (char, data) {
        char.changed = true;
        const cell = Convert.character_to_cell(char)
        if (cell == undefined)
            return;
        if (cell.can_rest() || (char.misc.tag == 'rat')) {
            char.set_fatigue(0);
            char.change_stress(-4);
        }
        else {
            char.set_fatigue(40);
        }
        char.send_status_update();
    },
    start: function (char, data) {
    },
};
