var common = require("../common.js");
var constants = require("../static_data/constants.js")
var weapons = require("../static_data/weapons.js")
const spells = require("../static_data/spells.js")

var Equip = require("./equip.js");
var Stash = require("./stash.js");
var Savings = require("./savings.js")
const CharacterGenericPart = require("./character_generic_part.js")


class Character2 extends CharacterGenericPart {
    constructor(world) {
        this.world = world;
        this.equip = new Equip();
        this.stash = new Stash();
        this.savings = new Savings();
        this.tag = 'chara';

        this.changed = false;
    }

    battle_update() {
        let dice = Math.random()
        if (dice < this.data.base_battle_stats.stress_battle_generation) {
            this.change_stress(1)
        }            
        this.equip.update(pool, this);
    }

    out_of_battle_update() {
        if (this.data.dead) {
            return
        }

        let reg = this.get_hp_change();
        this.change_hp(pool, reg, false);
        let rage_change = this.get_rage_change()
        this.change_rage(rage_change);
        let d_stress = this.get_stress_change()
        this.change_stress(d_stress)

        
        await this.update_status(pool, false);
    }

    status_check() {

        if (this.hp <= 0) {
            this.hp = 0;
            await this.world.kill(pool, this.id);
        }

        if (this.data.other.stress >= 100) {
            await this.world.kill(pool, this.id);
        }
    }


}



module.exports = class Character {
    constructor(world) {
        this.world = world;
        this.equip = new Equip();
        this.stash = new Stash();
        this.savings = new Savings();
        this.tag = 'chara';

        this.changed = false;
    }

    

    get_tag() {
        return 'test'
    }

    async init(pool, name, cell_id, user_id = -1) {
        this.init_base_values(name, 100, 100, 0, 0, cell_id, user_id);
        this.id = await this.load_to_db(pool);
        await this.save_to_db(pool);
        return this.id;
    }
    
    

    //actions

    async attack(pool, target) {
        let result = {}
        result.crit = false;
        result.evade = false;
        result.poison = false;
        result.blocked = false;
        result.rage_gain = 5;
        result.stress_gain = 1;
        result.blood_gain = 0;
        result.chance_to_hit = 0;
        result.total_damage = 0;
        result = this.equip.get_weapon_damage(result);
        result = this.mod_damage_with_stats(result);        
        result = this.roll_accuracy(result);
        result = this.roll_crit(result);
        result = target.roll_evasion(result);
        result = target.roll_block(result);
        this.change_rage(result.rage_gain);
        this.change_stress(result.stress_gain);
        this.change_blood(result.blood_gain);
        let dice = Math.random();
        if (dice > result.chance_to_hit) {
            result.evade = true;
        }
        result = await target.take_damage(pool, result);        
        return result;
    }

    async spell_attack(pool, target, tag) {
        let result = {};
        result.crit = false;
        result.evade = false;
        result.poison = false;
        result.blocked = false;
        result.total_damage = 0;
        result = spells[tag](result);
        result = this.mod_spell_damage_with_stats(result);
        result = await target.take_damage(pool, result);
        if ('rage' in result) {
            this.change_rage(result.rage);
        }
        return result;
    }

    async take_damage(pool, result) {
        let res = this.get_resists();
        if (!result.evade) {
            for (let i of this.world.constants.damage_types) {
                if (result.damage[i] > 0) {
                    let curr_damage = Math.max(0, result.damage[i] - res[i]);
                    result.total_damage += curr_damage;
                    this.update_status_after_damage(pool, i, curr_damage, false);
                    await this.change_hp(pool, -curr_damage, false);
                }                
            }
            this.change_blood(2);
            this.change_rage(2);
        }
        await this.save_to_db(pool)
        return result;
    }



    async level_up(pool, save) {
        while (this.data.exp >= common.get_next_nevel_req(this.data.level)) {
            this.data.exp -= common.get_next_nevel_req(this.data.level);
            this.data.level += 1;
            this.data.skill_points += 1;
        }
        if (save) {
            await this.save_to_db(pool);
        }
    }
    
    eat(pool) {
        if (!this.data.in_battle) {
            let tmp = this.stash.get('food');
            if (tmp > 0) {
                this.change_hp(pool, 10);
                this.stash.inc('food', -1);
            }
        }
        this.changed = true;
    }

    clean(pool) {
        if (!this.data.in_battle) {
            let tmp = this.stash.get('water');
            if (tmp > 0) {
                this.change_blood(-20);
                this.stash.inc('water', -1);
            }
        }
    }



    async move(pool, data) {
        if (this.in_battle()) {
            return 0
        }
        if (this.world.can_move(data.x, data.y)) {
            let {x, y} = this.world.get_cell_x_y_by_id(this.cell_id)
            let dx = data.x - x;
            let dy = data.y - y;
            if ((dx == 0 & dy == 1) || (dx == 0 & dy == -1) || (dx == 1 & dy == 0) || (dx == -1 & dy == 0) || (dx == 1 & dy == 1) || (dx == -1 & dy == -1)) {
                this.changed = true;
                this.cell_id = this.world.get_cell_id_by_x_y(data.x, data.y);
                console.log(this.name + ' move ' + data.x + data.y);
                this.change_stress(3);
                let tmp = this.world.get_territory(data.x, data.y)
                this.add_explored(this.world.get_id_from_territory(tmp));
                let danger = this.world.constants.ter_danger[tmp];
                let res = await this.attack_local_monster(pool, danger)
                this.world.socket_manager.send_explored(this);
                if (res != undefined) {
                    return 2
                } 
                return 1
            }
            return 0
        }
        return 0
    }

    async attack_local_monster(pool, enemies) {
        let battle = await this.world.attack_local_monster(pool, this, enemies);
        return battle
    }

    async attack_local_outpost(pool) {
        let battle = await this.world.attack_local_outpost(pool, this);
        return battle
    }

    //craft actions

    async craft_food(pool) {
        let res = 'ok';
        if ((!this.data.in_battle) & ('cook' in this.data.skills)) {
            let tmp = this.stash.get('meat');
            if (tmp > 0) {
                this.stash.inc('meat', -1);
                let chance = this.get_craft_food_chance();
                let dice = Math.random()
                let stress_gained = this.calculate_gained_failed_craft_stress('food');
                if (dice < chance) {
                    this.stash.inc('food', +1);
                    this.change_stress(Math.floor(stress_gained / 2));
                    res = 'ok'
                } else {
                    this.change_stress(stress_gained);
                    res = 'failed'
                }     
                this.changed = true;       
            } 
            else {
                res = 'not_enough_meat'
            }
        } else if (this.data.in_battle) {
            res = 'in_battle'
        } else if (!('cook' in this.data.skills)) {
            res = 'skill_cook_is_not_learnt'
        }
        return res
    }

    get_craft_food_chance() {
        let chance = 0.0;
        if ('cook' in this.data.skills) {
            chance += this.data.skills['cook'] * 0.2
        }
        return chance
    }

    async craft_clothes(pool) {
        let res = 'ok';
        if ((!this.data.in_battle) & ('sewing' in this.data.skills)) {
            let tmp = this.stash.get('leather');
            if (tmp > 0) {
                this.stash.inc('leather', -1);
                this.stash.inc('clothes', +1);
                let stress_gained = this.calculate_gained_failed_craft_stress('clothes');
                this.change_stress(stress_gained);
                this.changed = true;
            } else {
                res = 'not_enough_leather'
            }
        } else if (this.data.in_battle) {
            res = 'in_battle'
        } else if (!('sewing' in this.data.skills)) {
            res = 'skill_sewing_is_not_learnt'
        }
        return res
    }

    async enchant(pool, index) {
        let res = 'ok';
        if ((!this.data.in_battle) & ('enchanting' in this.data.skills)) {
            let item = this.equip.data.backpack[index]
            if (item == undefined) {
                res = 'no_selected_item'
                return res
            }
            let tmp = this.stash.get('zaz');
            if (tmp > 0) {
                this.stash.inc('zaz', -1);
                this.world.roll_affixes(this.equip.data.backpack[index], 5);
                let stress_gained = this.calculate_gained_failed_craft_stress('enchanting');
                this.change_stress(stress_gained);
            } else {
                res = 'not_enough_zaz'
            }
            this.changed = true;
        } else if (this.data.in_battle) {
            res = 'in_battle'
        } else if (!('enchanting' in this.data.skills)) {
            res = 'skill_enchanting_is_not_learnt'
        }
        return res
    }

    async disenchant(pool, index) {
        let res = 'ok';
        if ((!this.data.in_battle) & ('disenchanting' in this.data.skills)) {
            let item = this.equip.data.backpack[index]
            if (item == undefined) {
                res = 'no_selected_item'
                return res
            }
            this.equip.data.backpack[index] = undefined;
            let dice = Math.random();
            if (dice > 0.9) {
                this.stash.inc('zaz', +1);
            }
            let stress_gained = this.calculate_gained_failed_craft_stress('disenchanting');
            this.change_stress(stress_gained);
            this.changed = true;   
        } else if (this.data.in_battle) {
            res = 'in_battle'
        } else if (!('disenchanting' in this.data.skills)) {
            res = 'skill_disenchanting_is_not_learnt'
        }
        return res
    }

    //craft misc
    calculate_gained_failed_craft_stress(tag) {
        let total = 15;
        if ('less_stress_from_crafting' in this.data.skills) {
            total -= this.data.skills['less_stress_from_crafting'] * 3;
        }
        if (tag == 'food') {
            if ('less_stress_from_making_food' in this.data.skills) {
                total -= this.data.skills['less_stress_from_making_food'] * 5
            }
        }
        if (tag == 'enchanting') {
            if ('less_stress_from_enchanting' in this.data.skills) {
                total -= this.data.skills['less_stress_from_enchanting'] * 5
            }
        }
        if (tag == 'disenchanting') {
            if ('less_stress_from_disenchanting' in this.data.skills) {
                total -= this.data.skills['less_stress_from_disenchanting'] * 5
            }
        }
        total = Math.max(0, total)
        return total;
    }

    //attack misc

    mod_damage_with_stats(result) {
        result.damage['blunt'] = Math.floor(Math.max(1, result.damage['blunt'] * this.data.stats.musculature / 10));
        result.damage['pierce'] = Math.floor(Math.max(0, result.damage['pierce'] * this.data.stats.musculature / 10));
        result.damage['slice'] = Math.floor(Math.max(0, result.damage['slice'] * this.data.stats.musculature / 10));
        result.damage['fire'] = Math.floor(Math.max(0, result.damage['fire'] * this.get_magic_power() / 10));
        return result
    }

    mod_spell_damage_with_stats(result) {
        let power = this.get_magic_power() / 10
        result.damage['blunt'] = Math.floor(Math.max(1, result.damage['blunt'] * power));
        result.damage['pierce'] = Math.floor(Math.max(0, result.damage['pierce'] * power));
        result.damage['slice'] = Math.floor(Math.max(0, result.damage['slice'] * power));
        result.damage['fire'] = Math.floor(Math.max(0, result.damage['fire'] * power));
        return result
    }

    roll_accuracy(result) {
        result.chance_to_hit += this.get_accuracy()
        return result
    }

    roll_crit(result) {
        let dice = Math.random()
        let crit_chance = this.get_crit_chance;
        let mult = this.data.base_battle_stats.crit_mult;
        if (dice < crit_chance) {
            result.damage['blunt'] = result.damage['blunt'] * mult;
            result.damage['pierce'] = result.damage['pierce'] * mult;
            result.damage['slice'] = result.damage['slice'] * mult;
            result.crit = true;
        }
        return result
    }

    roll_evasion(result) {
        if (result.crit) {
            return result;
        }
        let dice = Math.random()
        let evade_chance = this.data.base_battle_stats.evasion;
        if (dice < evade_chance) {
            result.evade = true
        }
        return result
    }

    roll_block(result) {
        let dice = Math.random()
        let block_chance = this.get_block_chance();
        if (dice < block_chance) {
            result.blocked = true;
        }
        return result;
    }

    //getters

    get_item_lvl() {
        return 1;
    }

    get_magic_power() {
        let power = this.data.stats['pow'] + this.equip.get_magic_power();
        if (this.data.skills['blood_battery'] == 1) {
            power = power * (1 + this.data.other.blood_covering / 100);
        }
        return power;
    }

    get_resists() {
        let res = {}
        Object.assign(res, this.data.base_resists)
        let res_e = this.equip.get_resists();
        for (let i of this.world.constants.damage_types) {
            res[i] += res_e[i];
        }
        return res
    }

    

    get_actions() {
        let tmp = []
        for (let i in this.data.skills) {
            let action = this.world.constants.SKILLS[i].action
            if (action != undefined) {
                tmp.push(action)
            }
        }
        return tmp
    }

    get_accuracy() {
        let blood_burden = this.data.base_battle_stats.blood_burden;
        let rage_burden = this.data.base_battle_stats.rage_burden
        if (this.data.skills['rage_control'] == 1) {
            rage_burden -= 0.002;
        }
        if (this.data.skills['cold_rage'] == 1) {
            rage_burden -= 0.002;
        }
        if (this.data.skills['the_way_of_rage'] == 1) {
            rage_burden -= 0.002;
        }
        let blood_acc_loss = this.data.other.blood_covering * blood_burden;
        let rage_acc_loss = this.data.other.rage * rage_burden;
        return Math.min(1, Math.max(0.2, this.data.base_battle_stats.accuracy - blood_acc_loss - rage_acc_loss))
    }

    get_block_chance() {
        let tmp = this.data.base_battle_stats.block;
        if (this.data.skills['blocking_movements'] == 1) {
            tmp += 0.06;
        }
        return tmp;
    }

    get_crit_chance(tag) {
        if (tag == 'attack') {
            let increase = 1 + this.data.base_battle_stats.attack_crit_add + this.data.stats.int / 100;
            return this.data.base_battle_stats.crit_chance * increase;
        }
        if (tag == 'spell') {
            let increase = 1 + this.data.base_battle_stats.spell_crit_add + this.data.stats.int / 100;
            return this.data.base_battle_stats.crit_chance * increase
        }
    }
    
    get_exp_reward() {
        return this.data.exp_reward;
    }

    get_range() {
        return this.equip.get_weapon_range(1);
    }

    get_local_market() {
        var cell = this.world.get_cell_by_id(this.cell_id);
        return cell.market;
    }

    //setters

    async set(pool, nani, value, save = true) {
        if (this.data[nani] != value) {
            this.changed = true;
            this.data[nani] = value
        }
        this.save_to_db(pool, save);
    }

    set_faction(faction) {
        this.changed = true
        this.data.faction = faction.id
    }

    add_quest(quest, tag) {
        this.data.quest = {id: quest.id, tag: tag}
        this.savings.transfer(quest.savings, this.savings.get())
    }
    

    async update_status_after_damage(pool, type, x) {
        if (type == 'blunt') {
            if (x > 5) {
                let d = Math.random();
                if (d > 0.5) {
                    this.stun()
                }
            }
        }
    }

    async stun() {
        this.data.status.stunned = 2;
        this.changed = true;
    }

    async update_status() {
        for (let i of Object.keys(this.data.status)) {
            let x = this.data.status[i];
            if (x > 1) {
                this.changed = true;
            }
            this.data.status[i] = Math.max(x - 1, 0);
        }
    }

    async give_exp(pool, x, save = true) {
        await this.set_exp(pool, this.data.exp + x, save);
    }

    async set_exp(pool, x, save = true) {
        this.exp_changed = true;
        this.data.exp = x;
        if (this.data.exp >= common.get_next_nevel_req(this.data.level)) {
            await this.level_up(pool, false);
        }
        if (save) {
            await this.save_to_db(pool);
        }
    }

    //misc



    add_explored(tag) {
        this.data.explored[tag] = true;
    }

    is_player() {
        return this.data.is_player;
    }

    in_battle() {
        return this.data.in_battle;
    }
}