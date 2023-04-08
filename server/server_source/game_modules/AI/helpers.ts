import { battle_id } from "../../../../shared/battle_data"
import { Battle } from "../battle/classes/battle"
import { Character } from "../character/character"
import { hostile } from "../races/racial_hostility"
import { Event } from "../events/events"
import { Convert } from "../systems_communication"
import { cell_id, money } from "../types"
import { output_bulk } from "../craft/CraftBulk"
import { ELODINO_FLESH, materials, material_index, RAT_BONE, RAT_SKIN, WOOD, MEAT } from "../manager_classes/materials_manager"
import { Stash } from "../inventories/stash"
import { trim } from "../calculations/basic_functions"
import { durability } from "../craft/CraftItem"
import { box, CraftBulk, CraftItem } from "../craft/crafts_storage"
import { BattleAI } from "../battle/battle_ai"
import { MapSystem } from "../map/system"
import { AItrade } from "./AI_SCRIPTED_VALUES"

export function base_price(cell_id: cell_id, material: material_index): money {
    switch(material) {
        case WOOD: {
            let cell = MapSystem.id_to_cell(cell_id)
            if (cell?.can_gather_wood()) return 3 as money
            return 10 as money
        }
        case RAT_BONE:
            return 3 as money

        case RAT_SKIN:
            return 10 as money

        case WOOD: 
            return 10 as money

        case ELODINO_FLESH:
            return 50 as money
        
        case MEAT:
            return 8 as money
    }

    return 50 as money
}

interface price {
    material: material_index,
    price: money
}

interface priced_box {
    material: material_index,
    price: money
    amount: number
}

export namespace AIhelper {
    export function enemies_in_cell(char: Character) {
        let cell = Convert.character_to_cell(char)
        let a = cell.get_characters_list()
        for (let {id, name} of a) {
            let target_char = Convert.id_to_character(id)
            if (hostile(char.race(), target_char.race())) {
                if (!target_char.in_battle() && !target_char.dead()) {
                    return target_char.id
                }                
            }
        } 
        return -1
    }

    export function free_rats_in_cell(char: Character) {
        let cell = Convert.character_to_cell(char)
        let a = cell.get_characters_list()
        for (let {id, name} of a) {
            let target_char = Convert.id_to_character(id)
            if (target_char.race() == 'rat') {
                if (!target_char.in_battle() && !target_char.dead()) {
                    return target_char.id
                }                
            }
        } 
        return undefined
    }

    export function battles_in_cell(char: Character) {
        let battles:battle_id[] = []
        let cell = Convert.character_to_cell(char)
        if (cell == undefined) return battles
        let a = cell.get_characters_list()
        for (let {id, name} of a) {
            let target_char = Convert.id_to_character(id)
            if (target_char.in_battle() && !target_char.dead()) {
                battles.push(target_char.battle_id)
            }        
        } 
        return battles
    }
    export function check_battles_to_join(agent: Character) {
        let battles = battles_in_cell(agent)
        for (let item of battles) {
            let battle = Convert.id_to_battle(item)
            if (!(battle.ended)) {
                let team = check_team_to_join(agent, battle)
                if (team == 'no_interest') continue
                else {
                    Event.join_battle(agent, battle, team)
                    return true
                }
            }
        }
        return false
    }
    export function check_team_to_join(agent: Character, battle: Battle, exclude?: number):number|'no_interest' {
        let data = Object.values(battle.heap.data)
        let potential_team = -1
        for (let item of data) {
            const target = Convert.unit_to_character(item)
            if (BattleAI.is_friend(agent, target) && (item.team != exclude)) {
                if (potential_team == 0) continue
                else potential_team = item.team
            }
        }
        if (potential_team == -1) return 'no_interest'

        return potential_team
    }

    function price_norm(character: Character, items_vector: priced_box[]): number {
        let norm = 0
        for (let item of items_vector) {
            norm += item.amount * item.price
        }
        return norm
    }

    function price_norm_box(character: Character, items_vector: box[]): number {
        let norm = 0
        for (let item of items_vector) {
            norm += item.amount * AItrade.buy_price_bulk(character, item.material)
        }
        return norm
    }

    export function buy_craft_inputs(character: Character, budget: money, input: box[]): priced_box[] {
        // solve
        // sum (buy * base_price) < budget
        // (buy + stash) / input < 10
        let buy:priced_box[] = []

        // (buy) = (10 * input - stash) - find corner of buyment box
        for (let item of input) {
            const amount = trim(10 * item.amount - character.stash.get(item.material), 0, 9999)
            buy.push({material: item.material, amount: amount, price: AItrade.buy_price_bulk(character, item.material)})
        }

        // normalise (buy) with price metric down to budget
        let norm = price_norm(character, buy)
        if (norm < 1) norm = 1
        const multiplier = budget / norm
        for (let item of buy) {
            item.amount = Math.floor(item.amount * multiplier)
        }

        return buy
    }

    export function sell_prices_craft_bulk(character: Character, craft: CraftBulk): price[] {
        const input_price = price_norm_box(character, craft.input)
        const estimated_output = output_bulk(character, craft)

        let prices: price[] = []
        for (let item of estimated_output) {
            prices.push({material: item.material, price: Math.round(input_price * 2 / item.amount) as money})
        }

        return prices
    }

    export function sell_price_craft_item(character: Character, craft: CraftItem): money {
        const input_price = price_norm_box(character, craft.input)
        const estimated_quality = durability(character, craft)

        return Math.floor(input_price * 2 * estimated_quality / 100 + Math.random() * 10) + 1 as money
    }
}