import { cell_id, money } from "@custom_types/common";
import { Data } from "./data";
import { Effect } from "./events/effects";
import { Cell } from "./map/DATA_LAYOUT_CELL";
import { Template } from "./templates";
import { LandPlotType } from "@custom_types/buildings";

// steppe_humans 9 9
// city 2 6
// rats 12 16
// graci 17 13
// elodino_free 24 20
// big_humans 10 28
const LUMP_OF_MONEY = 1000 as money
const TONS_OF_MONEY = 30000 as money


export namespace GameMaster {
    export function spawn_faction(cell_id: cell_id, faction: string) {
        console.log('spawn ' + faction)
        const [x, y] = Data.World.id_to_coordinate(cell_id)
        if (faction == 'city') {
            // creation of mayor
            const mayor = Template.Character.HumanCity(x, y, 'Mayor')
            mayor.savings.inc(TONS_OF_MONEY)
            Data.World.set_faction_leader(faction, mayor.id)

            const mayor_house = Effect.new_building(cell_id, LandPlotType.HumanHouse, 200, 30 as money)
            Data.Buildings.set_ownership(mayor.id, mayor_house)

            // creation of first colonists
            Template.Character.HumanCook(x, y, "Cook", 'city')
            Template.Character.Shoemaker(x, y)
            Template.Character.HumanFletcher(x, y, "Fletcher", 'city')
            Template.Character.ArmourMaster(x, y)
            Template.Character.WeaponMasterWood(x, y, 'city')

            // colony mages
            Template.Character.Alchemist(x, y, 'city')
            Template.Character.Mage(x, y, 'city')


            //hunters
            for (let i = 0; i <= 10; i++) {
                const hunter = Template.Character.HumanRatHunter(x, y, "Hunter " + i)
                hunter.savings.inc(500 as money)
            }
            //guards
            for (let i = 0; i <= 5; i++) {
                const guard = Template.Character.HumanCityGuard(x, y, "Guard " + i)
                guard.savings.inc(500 as money)
            }
            // innkeeper
            const innkeeper = Template.Character.HumanCity(x, y, "Innkeeper")
            const inn = Effect.new_building(cell_id, LandPlotType.Inn, 200, 10 as money)
            Data.Buildings.set_ownership(innkeeper.id, inn)
        }


        if (faction == 'steppe_humans') {
            // innkeeper
            const innkeeper = Template.Character.HumanCity(x, y, "Innkeeper")
            const inn = Effect.new_building(cell_id, LandPlotType.Inn, 200, 10 as money)
            Data.Buildings.set_ownership(innkeeper.id, inn)

            // creation of local colonists
            Template.Character.HumanCook(x, y, "Cook", 'steppe')
            Template.Character.WeaponMasterBone(x, y, faction)
            Template.Character.BloodMage(x, y, faction)
            Template.Character.MasterUnarmed(x, y, faction)
        }        

        if (faction == 'rats') {
            const rat_lair = Effect.new_building(cell_id, LandPlotType.RatLair, 400, 0 as money)
        }

        if (faction == 'elodino_free') {
            const elodino_city = Effect.new_building(cell_id, LandPlotType.ElodinoHouse, 400, 0 as money)
        }

        if (faction == 'graci') {
            for (let i = 1; i <= 30; i++) {
                Template.Character.Graci(x, y, undefined)
            }
        }
    }

    export function update(dt: number) {
        let rats = 0
        let elos = 0
        for (const character of Data.CharacterDB.list()) {
            if (character.race() == 'rat') {
                rats += 1
            }
            if (character.race() == 'elo') {
                elos += 1
            }
        }

        for (const cell of Data.Cells.list_ids()) {
            const buildings = Data.Buildings.from_cell_id(cell)
            if (buildings == undefined) continue
            for (const item of buildings) {
                const building = Data.Buildings.from_id(item)
                if (building.type == LandPlotType.RatLair) {
                    let cell_object = Data.Cells.from_id(cell)
                    cell_object.rat_scent = 200
                    cell_object.rat_scent += 5 * dt / 100
                    spawn_rat(rats, cell_object)
                }

                if (building.type == LandPlotType.ElodinoHouse) {
                    let cell_object = Data.Cells.from_id(cell)
                    spawn_elodino(elos, cell_object)
                }
            }
        }
    }

    export function spawn_rat(rats_number: number, cell: Cell) {        
        if (rats_number < 50) {
            let dice_spawn = Math.random()
            if (dice_spawn > 0.4) return            
            let dice = Math.random()
            if (dice < 0.6) {
                Template.Character.GenericRat(cell.x, cell.y, undefined)
            } else if (dice < 0.8) {
                Template.Character.BigRat(cell.x, cell.y, undefined)
            } else if (dice < 1) {
                Template.Character.MageRat(cell.x, cell.y, undefined)
            }                
        }
    }

    export function spawn_elodino(elos_number: number, cell: Cell) {
        if (elos_number < 60) {
            let dice = Math.random()
            if (dice < 0.7) {
                Template.Character.Elo(cell.x, cell.y, undefined)
            } else {
                Template.Character.MageElo(cell.x, cell.y, undefined)
            }
        }
    }
}