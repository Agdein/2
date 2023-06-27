import { CharacterAction } from "../actions/actions_00"
import { ActionManager } from "../actions/manager"
import { BattleSystem } from "../battle/system"
import { Character } from "../character/character"
import { Event } from "../events/events"
import { Convert } from "../systems_communication"
import { AIactions } from "./AIactions"
import { rat_go_home, rat_walk } from "./actions"
import { simple_constraints, steppe_constraints } from "./constraints"
import { AIhelper } from "./helpers"

export function RatRoutine(char: Character) {
    if ((char.get_fatigue() > 90) || (char.get_stress() > 90)) {
        // console.log('rest')
        ActionManager.start_action(CharacterAction.REST, char, char.cell_id)
        return
    } else if (char.get_fatigue() > 50) {
        // console.log('go home')
        rat_go_home(char, simple_constraints)
        return
    }

    rat_walk(char, simple_constraints)
}