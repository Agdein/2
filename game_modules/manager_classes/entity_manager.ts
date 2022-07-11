import {constants} from '../static_data/constants'
var common = require("../common.js");
const Area = require('../base_game_classes/area.js')
const Faction = require('../base_game_classes/faction.js')
const Quest = require('../base_game_classes/quest.js')

import { World } from "../world";
import {Cell} from '../cell'
import { CharacterGenericPart } from "../base_game_classes/character_generic_part";
import { MarketOrder, market_order_index } from "../market/market_order";
import { BattleReworked2 } from "../battle";
import { ITEM_MATERIAL } from '../static_data/item_tags';
import { material_index } from './materials_manager';
import { money } from '../base_game_classes/savings';
import { AuctionOrderManagement, auction_order_id, OrderItem } from '../market/market_items';


export class EntityManager {
    world: World
    cells: Cell[][]
    chars: CharacterGenericPart[]
    orders: MarketOrder[]
    item_orders: OrderItem[]
    battles: BattleReworked2[]
    areas: any[]
    factions: any[]
    quests: any[]

    time_since_last_decision_update: number

    constructor(world: World) {
        this.world = world;
        this.chars = [];
        this.orders = [];
        this.item_orders = [];
        this.battles = [];

        this.cells = [];
        this.areas = [];

        this.factions = []
        this.quests = []
        this.time_since_last_decision_update = 0
    }

    async init(pool: any) {
        await this.init_cells(pool);
    }

    async load(pool: any) {
        await this.load_cells(pool)
        await this.load_characters(pool);
        await this.load_orders(pool);
        await this.load_item_orders(pool);
        await this.load_battles(pool);
        await this.load_areas(pool);
        await this.load_factions(pool);
        await this.load_quests(pool);
        await this.clear_dead_orders(pool);
    }

    async init_cells(pool: any) {
        let data: {[_ in string]: any} = this.world.constants.development 
        let data_res: {[_ in string]: any} = this.world.constants.resources
        for (var i = 0; i < this.world.x; i++) {
            var tmp = []
            for (var j = 0; j < this.world.y; j++) {
                var cell = new Cell(this.world, this, i, j, '', data[i + '_' + j], data_res[i + '_' + j]);
                await cell.init(pool);
                tmp.push(cell);
            }
            this.cells.push(tmp);
        }
    }

    async load_cells(pool: any) {
        for (let i = 0; i < this.world.x; i++) {
            let tmp = []
            for (let j = 0; j < this.world.y; j++) {
                let cell = new Cell(this.world, this, i, j, '', {rural: 0, ruins:0, urban:0, wild: 0, wastelands: 0}, {water: false, prey: false, fish: false, forest: false});
                tmp.push(cell);
            }
            this.cells.push(tmp);
        }

        for (let i = 0; i < this.world.x; i++) {
            for (let j = 0; j < this.world.y; j++) {
                await this.cells[i][j].load(pool);
            }
        }
    }

    get_cell(x: number, y: number) {
        if (this.validate_cell(x, y)){
            return this.cells[x][y];
        }
        return undefined
    }

    validate_cell(x: number, y: number) {
        return (y >= 0) && (y < this.world.y) && (x >= 0) && (x < this.world.x)
    }

    get_cell_by_id(id: number) {
        // console.log(id);
        return this.get_cell(Math.floor(id / this.world.y), id % this.world.y);
    }

    get_cell_id_by_x_y(x: number, y: number) {
        return x * this.world.y + y
    }

    async load_characters(pool: any) {
        let res = await common.send_query(pool, constants.load_chars_query);
        for (let i of res.rows) {
            let char = new CharacterGenericPart(this.world);
            char.load_from_json(i);
            this.chars[char.id] = char;
            let cell = this.get_cell_by_id(char.cell_id)
            if (cell != undefined) {
                cell.enter(char)
            }
        }
        console.log('characters loaded')
    }

    async load_orders(pool: any) {
        let res = await common.send_query(pool, constants.load_orders_query);
        for (let i of res.rows) {
            let order = new MarketOrder(this.world);
            order.load_from_json(i);
            this.orders[order.id] = order;
            this.get_cell_by_id(order.cell_id)?.add_order(order.id)
        }
        console.log('orders loaded')
    }

    transfer_orders(character:CharacterGenericPart, cell_id: number) {
        let target_cell = this.get_cell_by_id(cell_id)
        if (target_cell != undefined) {
            for (let order of this.orders) {
                if ((order != undefined) && (order.owner == character)) {
                    this.get_cell_by_id(order.cell_id)?.transfer_order(order.id, target_cell)
                    order.cell_id = cell_id
                }
            }
        }
        
    }

    async load_item_orders(pool: any) {
        let res = await common.send_query(pool, constants.load_item_orders_query);
        for (let i of res.rows) {
            let order = AuctionOrderManagement.json_to_order(i, this)
            this.item_orders[order.id] = order;
        }
        console.log('item orders loaded')
    }

    async load_battles(pool: any) {
        let res = await common.send_query(pool, constants.load_battles_query);
        for (let i of res.rows) {
            let battle = new BattleReworked2(this.world);
            battle.load_from_json(i);
            this.battles[battle.id] = battle;
        }
        console.log('battles loaded')
    }

    async load_areas(pool: any) {
        let res = await common.send_query(pool, constants.load_areas_query);
        for (let i of res.rows) {
            let obj = new Area(this.world);
            obj.load_from_json(i);
            this.areas[obj.id] = obj;
        }
        console.log('areas loaded')
    }

    async load_factions(pool: any) {
        let res = await common.send_query(pool, constants.load_factions_query);
        for (let i of res.rows) {
            let faction = new Faction(this.world);
            faction.load_from_json(i);
            this.factions[faction.id] = faction;
        }
        console.log('factions loaded')
    }

    async load_quests(pool: any) {
        let res = await common.send_query(pool, constants.load_quests_query);
        for (let i of res.rows) {
            let quest = new Quest(this.world);
            quest.load_from_json(i);
            this.quests[quest.id] = quest;
        }
        console.log('quests loaded')
    }

    async clear_dead_orders(pool: any) {
        // this.map.clear_dead_orders(pool);
    }


    async update_chars(pool: any, dt: number) {
        this.time_since_last_decision_update += dt
        let decision_flag = false
        // console.log(this.time_since_last_decision_update)
        if (this.time_since_last_decision_update > 60) {
            // console.log('decision_time'); 
            decision_flag = true; 
            this.time_since_last_decision_update = 0
        }
        for (let i = 0; i < this.chars.length; i++) {
            // console.log(this.chars[i]?.get_cell()?.i, this.chars[i]?.get_cell()?.j)
            if ((this.chars[i] != undefined) && !this.chars[i].is_dead()) {
                let char = this.chars[i]
                if (!char.in_battle()) {
                    await char.update(pool, dt);
                    if (decision_flag) {await this.world.ai_manager.decision(char)}
                }
            } else if ((this.chars[i] != undefined) && this.chars[i].is_dead()) {
                await this.kill(pool, i)
            }
        }
    }

    async update_cells(pool:any, dt: number) {
        for(let i = 0; i < this.world.x; i++) {
            for(let j = 0; j < this.world.y; j++) {
                this.cells[i][j].update(pool, dt)
            }
        }
    }   

    async update_battles(pool: any) {
        for (let i in this.battles) {
            var battle = this.battles[i]
            if ((battle == null) || (battle == undefined) || battle.ended) {
                continue
            }

            let res = battle.is_over();
            if (res == -1) {
                await battle.update(pool)
            } else {                
                battle.clean_up_battle()
                await this.delete_battle(pool, battle.id);
            }
        }
    }

    async update_factions(pool: any) {
    }

    set_faction_leader(faction: any, leader: CharacterGenericPart) {
        faction.set_leader(leader)
        leader.set_faction(faction)
    }

    async update_areas(pool: any) {
        for (let i in this.areas) {
            let area = this.areas[i]
            for (let faction_id in area.faction_influence) {
                // let faction = this.factions[faction_id]
                // let leader = this.chars[faction.leader_id]
                // if ((faction.tag != 'steppe_rats') & (area.get_influence('steppe_rats') >= 10)) {
                //     let quest_money_reward = Math.floor(area.get_influence('steppe_rats') / 10)
                //     let quest_reputation_reward = Math.floor(area.get_influence('steppe_rats') / 5)
                //     await this.new_quest(pool, leader, 'meat', quest_money_reward, quest_reputation_reward)
                // }
            }
        }
    }
    
    async new_quest(pool: any, leader: CharacterGenericPart, item_tag: ITEM_MATERIAL, money_reward: number, reputation_reward: number, tag: string) {
        // let quest = await this.create_quest(pool, item_tag, money_reward, reputation_reward);
        // leader.add_quest(quest, tag)
    }

    async generate_order(pool: any, typ:"sell"|"buy", tag:material_index, owner:CharacterGenericPart, amount:number, price:money, cell_id:number) {
        let order = new MarketOrder(this.world)
        await order.init(pool, typ, tag, owner, amount, price, cell_id)

        this.orders[order.id] = order
        this.get_cell_by_id(order.cell_id)?.add_order(order.id)
        return order
    }

    async add_order(pool: any, order: MarketOrder) {
        this.orders[order.id] = order;
        this.get_cell_by_id(order.cell_id)?.add_order(order.id)
    }

    async remove_orders(pool:any, character: CharacterGenericPart) {
        let temporary_list = []
        for (let order of this.orders) {
                if (order != undefined) {
                    if (order.owner_id == character.id) {
                    temporary_list.push(order.id)
                } 
            }            
        }
        
        for (let id of temporary_list) {
            await this.remove_order(pool, id)
        }

        let cell = character.get_cell()

        if (cell != undefined) {
            this.world.socket_manager.update_market_info(cell)
        }        
    }

    async remove_order(pool: any, order_id: market_order_index) {
        let order = this.orders[order_id]
        let cell = this.get_cell_by_id(order.cell_id)
        cell?.remove_order(order_id)
        let character = order.owner
        if (order.typ == 'buy') {
            character?.trade_savings.transfer(character.savings, order.amount * order.price as money)
        }
        if (order.typ == 'sell') {
            character?.trade_stash.transfer(character.stash, order.tag, order.amount)
        }
        order.amount = 0
        await order.delete_from_db(pool)
    }

    add_item_order(order: any) {
        this.item_orders[order.id] = order
    }

    get_order (order_id: market_order_index) {
        return this.orders[order_id];
    }

    get_item_order (id: auction_order_id) {
        return this.item_orders[id];
    }

    get_from_id_tag(id: number, tag: 'chara'|'cell') {
        if (tag == 'chara') {
            return this.chars[id]
        }
        if (tag == 'cell') {
            return this.get_cell_by_id(id)
        }
    }

    async kill(pool: any, char_id: number) {
        
        let character = this.chars[char_id];
        if ((character.get_hp() == 0) && (!character.deleted)) {
            await character.clear_orders(pool);
            await character.set_flag('dead', true);
            let cell = this.get_cell_by_id(character.cell_id)
            cell?.exit(character)
            console.log('kill ' + char_id);
            this.chars[char_id].deleted = true
            await character.delete_from_db(pool);
            if (character.is_player()) {
                var user = this.world.user_manager.get_user_from_character(character);
                if (user == undefined) {
                    return
                }
                user.send_death_message()
                var id = await user.get_new_char(pool);
                this.chars[id] = user.get_character();
            }            
        }
        
        // this.chars[character.id] = null;
    }

    async create_battle(pool: any, attackers: CharacterGenericPart[], defenders: CharacterGenericPart[]) {
        for (let i = 0; i < attackers.length; i++) {
            if (attackers[i].in_battle() || attackers[i].is_dead()) {
                return
            }
        }
        for (let i = 0; i < defenders.length; i++) {
            if (defenders[i].in_battle() || attackers[i].is_dead()) {
                return
            }
        }

        var battle = new BattleReworked2(this.world);
        await battle.init(pool);
        for (let i = 0; i < attackers.length; i++) {
            battle.add_fighter(attackers[i], 0, {x: 0, y:0});
        }
        for (let i = 0; i < defenders.length; i++) {
            battle.add_fighter(defenders[i], 1, {x: Math.random() * 5 - 2.5, y: Math.random() * 4 + 5});
        }
        this.battles[battle.id] = battle;
        battle.send_data_start()
        return battle;
    }

    async create_new_character(pool: any, name: string, cell_id: number, user_id: number) {
        console.log('character ' + name + ' is created')
        
        let char = new CharacterGenericPart(this.world);
        await char.init(pool, name, cell_id, user_id);
        console.log('his id is ' + char.id)

        this.chars[char.id] = char
        let cell = char.get_cell()
        cell?.enter(char)
        return char
    }

    async create_area(pool: any, tag: string) {
        let area = new Area(this.world)
        let id = await area.init(pool, tag, {}, {});
        this.areas[id] = area;
        return area
    }

    async create_faction(pool: any, tag: string) {
        let faction = new Faction(this.world)
        let id = await faction.init(pool, tag)
        this.factions[id] = faction;
        return faction
    }

    async create_quest(pool: any, item: ITEM_MATERIAL, reward_money: number, reward_reputation: number) {
        let quest = new Quest(this.world)
        let id = await quest.init(pool, item, reward_money, reward_reputation)
        this.quests[id] = quest;
        return quest;
    }

    async delete_battle(pool: any, id: number) {
        var battle = this.battles[id];
        await battle.delete_from_db(pool);
        this.battles[id].ended = true;
    }
    
    async load_character_data_from_db(pool: any, char_id: number) {
        var res = await common.send_query(pool, constants.select_char_by_id_query, [char_id]);
        if (res.rows.length == 0) {
            return null;
        }
        return res.rows[0];
    }

    async load_character_data_to_memory(pool: any, data: any) {
        var character = new CharacterGenericPart(this.world);
        await character.load_from_json(data)
        this.chars[data.id] = character;
        return character;
    }
}