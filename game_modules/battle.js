var common = require("./common.js");
var constants = require("./constants.js");

var Stash = require("./stash.js");
var Savings = require("./savings.js");
var BattleAI = require("./battle_ai.js")

module.exports = class Battle {
    async init(pool, world) {
        this.id = await world.get_new_id(pool, 'battle_id');
        // var range = world.BASE_BATTLE_RANGE;
        this.world = world;
        this.ids = [];
        this.teams = [];
        this.positions = [];
        this.stash = new Stash();
        this.savings = new Savings();
        await this.load_to_db(pool);
        return this.id;
    }

    get_data() {
        var data = {}
        for (var i = 0; i < this.ids.length; i++) {
                var character = this.world.chars[this.ids[i]]
                data[i] = {}
                data[i].id = this.ids[i];
                data[i].position = this.positions[i];
                data[i].tag = character.get_tag();
            }
        return data
    }
    

    async add_fighter(pool, agent, team) {
        this.ids.push(agent.id);
        this.teams.push(team);
        if (team == 1) {
            this.positions.push(this.world.BASE_BATTLE_RANGE);
        } else {
            this.positions.push(0);
        }
        await agent.set(pool, 'battle_id', this.id, false);
        await agent.set(pool, 'index_in_battle', this.ids.length - 1, false);
        await agent.set(pool, 'in_battle', true);
        this.save_to_db(pool);
    }

    async update(pool) {
        var log = [];
        for (var i = 0; i < this.ids.length; i++) {
            var char = this.world.chars[this.ids[i]]
            if (char.get_hp() > 0) {
                var log_entry = await BattleAI.action(pool, char, true)
                log.push(log_entry)
            }
        }
        await this.save_to_db(pool);
        return log;
    }

    async action(pool, actor_index, action) {
        var character = this.world.chars[this.ids[actor_index]];
        if (action.action == 'move') {
            if (action.target == 'right') {
                this.positions[actor_index] += 1;
            } else {
                this.positions[actor_index] -= 1;
            }
            return `${character.name} ${action.action} ${action.target}`
        } else if (action.action == 'attack') {
            if (action.target != null) {
                var target_char = this.world.chars[this.ids[action.target]];
                var damage = await character.attack(pool, target_char);
                return `${character.name} ${action.action} ${target_char.name} and deals ${damage} damage`;
            }
            return 'pfff';
        }
    }

    is_over() {
        var hp = [0, 0];
        for (var i = 0; i < this.ids.length; i++) {
            var character = this.world.chars[this.ids[i]];
            var x = 0
            if (character == null) {
                x = 0
            } else {
                x = character.hp;
            }
            hp[this.teams[i]] += x;
        }
        if (hp[0] == 0) {
            return 1;
        }
        if (hp[1] == 0) {
            return 0;
        }
        return -1;
    }

    async collect_loot(pool) {
        for (var i = 0; i < this.ids.length; i ++) {
            var character = this.world.chars[this.ids[i]];
            if (character.hp == 0) {
                await character.transfer_all(pool, this);
            }
        }
    }

    reward(team) {
        var exp = 0;
        for (var i = 0; i < this.ids.length; i++) {
            if (this.teams[i] == team) {
                exp += this.world.chars[this.ids[i]].get_exp_reward();
            }
        }
        return exp;
    }

    async reward_team(pool, team, exp) {
        var n = 0;
        for (let i = 0; i < this.ids.length; i++){
            if (this.teams[i] == team) {
                n += 1
            }
        }
        for (let i = 0; i < this.ids.length; i++) {
            var character = this.world.chars[this.ids[i]];
            if (this.teams[i] == team && !character.data.dead) {
                await character.give_exp(pool, Math.floor(exp / n));
            }
            await character.set(pool, 'in_battle', false);
        }
        var i = 0;
        while (this.teams[i] != team) {
            i += 1;
        }
        var leader = this.world.chars[this.ids[i]];
        for (var tag of this.world.constants.TAGS) {
            var x = this.stash.get(tag);
            await this.transfer(pool, leader, tag, x);
        }
    }

    async load_to_db(pool) {
        await common.send_query(pool, constants.new_battle_query, [this.id, this.ids, this.teams, this.positions]);
    }

    async save_to_db(pool) {
        await common.send_query(pool, constants.update_battle_query, [this.id, this.ids, this.teams, this.positions])
    }

    async delete_from_db(pool) {
        await common.send_query(pool, constants.delete_battle_query, [this.id]);
    }

    async transfer(pool, target, tag, x) {
        this.stash.transfer(target.stash, tag, x);
        await this.save_to_db(pool);
        await target.save_to_db(pool);
    }
}