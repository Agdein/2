import { CharacterGenericPart } from "../character_generic_part";
import {CharacterActionResponce} from '../../manager_classes/action_manager'

export const rest = {
    check: async function(pool: any, char:CharacterGenericPart, data: any): Promise<CharacterActionResponce> {
        if (!char.in_battle()) {
            let cell = char.get_cell();
            if (cell == undefined) {
                return CharacterActionResponce.INVALID_CELL
            }
            if (cell.can_rest() || (char.misc.tag == 'rat')) {
                return CharacterActionResponce.OK
            } 
            return CharacterActionResponce.NO_RESOURCE
        } 
        return CharacterActionResponce.IN_BATTLE
    },

    result: async function(pool: any, char:CharacterGenericPart, data: any) {
        char.changed = true
        char.change_fatigue(-20)
        char.change_stress(-5)
        char.send_status_update()
    },

    start: async function(pool: any, char:CharacterGenericPart, data: any) {
    },
}