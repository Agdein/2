"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unlink = exports.Link = exports.Convert = void 0;
const system_1 = require("./base_game_classes/character/system");
const user_manager_1 = require("./client_communication/user_manager");
const system_2 = require("./map/system");
var Convert;
(function (Convert) {
    function user_to_character(user) {
        if (user.data.char_id == '@')
            return undefined;
        return system_1.CharacterSystem.id_to_character(user.data.char_id);
    }
    Convert.user_to_character = user_to_character;
    function character_to_user_data(character) {
        if (character.user_id == '#')
            return undefined;
        return user_manager_1.UserManagement.get_user_data(character.user_id);
    }
    function character_to_user(character) {
        let data = character_to_user_data(character);
        if (data == undefined)
            return undefined;
        return user_manager_1.UserManagement.get_user(data.id);
    }
    Convert.character_to_user = character_to_user;
    function character_to_cell(character) {
        let cell = system_2.MapSystem.SAFE_id_to_cell(character.cell_id);
        return cell;
    }
    Convert.character_to_cell = character_to_cell;
})(Convert = exports.Convert || (exports.Convert = {}));
var Link;
(function (Link) {
    function character_and_user_data(character, user) {
        console.log('linking user and character');
        character.user_id = user.id;
        user.char_id = character.id;
        if (user_manager_1.UserManagement.user_is_online(user.id)) {
            console.log('user is online');
            let user_online = user_manager_1.UserManagement.get_user(user.id);
            user_manager_1.UserManagement.add_user_to_update_queue(user_online.data.id, 'character_creation');
        }
    }
    Link.character_and_user_data = character_and_user_data;
    function character_and_cell(character, cell) {
        // add to the list and notify locals
        // note: rewrite later to lazy sending: send local characters to local characters once in X seconds if there are changes
        //       and send list immediately only to entering user
        cell.enter(character.id);
        const locals = cell.get_characters_list();
        for (let item of locals) {
            const id = item.id;
            const local_character = system_1.CharacterSystem.id_to_character(id);
            const local_user = Convert.character_to_user(local_character);
            if (local_user == undefined) {
                continue;
            }
            user_manager_1.UserManagement.add_user_to_update_queue(local_user.data.id, 8 /* UI_Part.LOCAL_CHARACTERS */);
        }
        // check if it is a user and needs updates, otherwise return immediately
        const user = Convert.character_to_user(character);
        if (user == undefined) {
            return;
        }
        // exploration
        character.explored[cell.id] = true;
        let neighbours = system_2.MapSystem.neighbours_cells(cell.id);
        for (let item of neighbours) {
            character.explored[item.id] = true;
        }
        user_manager_1.UserManagement.add_user_to_update_queue(character.user_id, 9 /* UI_Part.EXPLORED */);
    }
    Link.character_and_cell = character_and_cell;
})(Link = exports.Link || (exports.Link = {}));
var Unlink;
(function (Unlink) {
    function character_and_cell(character, cell) {
        character.cell_id = cell.id;
    }
    Unlink.character_and_cell = character_and_cell;
})(Unlink = exports.Unlink || (exports.Unlink = {}));
// enter(char: Character) {
//     this.characters_set.add(char.id)
//     this.world.socket_manager.send_market_info_character(this, char)
//     this.world.socket_manager.send_cell_updates(this)
// }
// exit(char: Character) {
//     this.characters_set.delete(char.id)
//     this.world.socket_manager.send_cell_updates(this)
// }
