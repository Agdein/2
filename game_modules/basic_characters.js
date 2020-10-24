var Character = require("./character.js")

class Rat extends Character {
    async init(pool, cell_id, name = null) {
        if (name == null) {
            name = 'rat';
        }
        this.init_base_values(name, 40, 40, 0, 0, cell_id);
        this.data.stats = this.world.constants.base_stats.rat
        this.data.base_resists = this.world.constants.base_resists.rat
        this.equip.data.right_hand = {tag: 'empty', affixes: 0}
        this.stash.inc('meat', 1);
        this.data.model = 'rat'
        this.data.exp_reward = 50
        await this.load_to_db(pool);
        return this.id;
    }

    get_range() {
        return 1
    }

    get_tag() {
        return 'rat'
    }
    get_item_lvl() {
        return 2;
    }
}

class Elodino extends Character {
    async init(pool, cell_id, name = null) {
        if (name == null) {
            name = 'elodino';
        }
        this.init_base_values(name, 100, 100, 0, 0, cell_id);
        this.data.stats = this.world.constants.base_stats.elodino
        this.data.base_resists = this.world.constants.base_resists.rat
        this.equip.data.right_hand = {tag: 'empty', affixes: 1, a0: {tag: 'sharp', tier: 1}}
        this.data.exp_reward = 200
        this.stash.inc('meat', 2);
        this.data.model = 'elodino'
        await this.load_to_db(pool);
        return this.id;
    }

    get_range() {
        return 1
    }

    get_tag() {
        return 'elodino'
    }
    get_item_lvl() {
        return 5;
    }
}

class Graci extends Character {
    async init(pool, cell_id, name = null) {
        var id = await this.world.get_new_id(pool, 'char_id');
        if (name == null) {
            name = 'graci ' + id;
        }
        this.init_base_values(id, name, 200, 200, 0, 0, cell_id);
        this.data.stats = this.world.constants.base_stats.graci
        this.data.base_resists = this.world.constants.base_resists.rat
        this.equip.data.right_hand = {tag: 'empty', affixes: 1, a0: {tag: 'sharp', tier: 2}}
        this.data.model = 'graci'
        this.data.movement_speed = 2;
        this.data.exp_reward = 500
        await this.load_to_db(pool);
        return id;
    }

    get_tag() {
        return 'graci'
    }
    get_item_lvl() {
        return 10;
    }

    get_range() {
        return 2
    }

    change_rage(x) {
    }

    change_blood(x) {
    }
}

module.exports = {
    rat: Rat,
    graci: Graci,
    elodino: Elodino
}