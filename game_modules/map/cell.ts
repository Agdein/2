import { CharacterSystem } from "../base_game_classes/character/system.js";
import { cell_id, char_id, order_bulk_id, order_item_id, terrain} from "../types.js";
import { CellResources, Development } from "../static_data/map_definitions.js";



interface Actions {
    hunt: boolean
    rest: boolean
    clean: boolean
}

export class Cell {
    x: number;
    y: number;
    id: cell_id;

    name: string;

    visited_recently: boolean;
    last_visit: number

    development: Development;
    resources: CellResources;
    terrain: terrain;

    characters_set: Set<char_id>
    orders_bulk: Set<order_bulk_id>
    orders_item: Set<order_item_id>

    constructor(id: cell_id, x: number, y:number, name:string, development: Development, res: CellResources, terrain: terrain) {
        this.id = id
        this.x = x
        this.y = y

        this.name = name;
        this.visited_recently = false;
        this.last_visit = 0;
        this.orders_bulk = new Set()
        this.orders_item = new Set()
        this.characters_set = new Set()

        if (development == undefined) {
            this.development = {rural: 0, urban: 0, wild: 0, ruins: 0, wastelands: 0};
        } else {
            this.development = development
        }

        if (res == undefined) {
            this.resources = {water: false, prey: false, forest: false, fish: false}
        } else {
            this.resources = res
        }

        if (terrain == undefined ) {
            this.terrain = 'void'
        } else {
            this.terrain = terrain
        }
    }

    get_characters_list(): {id: char_id, name:string}[] {
        let result = []
        for (let item of this.characters_set.values()) {
            let character = CharacterSystem.id_to_character(item)
            let return_item = {id: item, name: character.name}
            result.push(return_item)
        }
        return result
    }

    get_characters_id_set() {
        return this.characters_set
    }

    get_actions(): Actions {
        let actions: Actions = {
            hunt: false,
            rest: false,
            clean: false
        }

        actions.hunt = this.can_hunt()
        actions.clean = this.can_clean()
        actions.rest = this.can_rest()
        return actions
    }

    can_clean(): boolean{
        return (this.resources.water)
    }

    can_hunt(): boolean{
        return ((this.development.wild > 0) || (this.resources.prey))
    }

    can_rest(): boolean{
        return (this.development.urban > 0)
    }

    get_item_market() {
        return undefined
    }

    get_market() {
        return undefined
    }

    visit() {
        this.visited_recently = true
        this.last_visit = 0
    }

    async update(dt: number) {
        if (this.visited_recently) {
            this.last_visit += dt
            if (this.last_visit > 10) {
                this.visited_recently = false
                this.last_visit = 0
            }
        }
    }
}