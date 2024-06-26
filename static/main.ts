// const game_tabs = ['map', 'battle', 'skilltree', 'market', 'character', 'quest', 'stash', 'craft']
import { init_stash, update_stash } from './modules/Stash/stash.js';
import { init_authentication_control } from './modules/Auth/login.js';
import { BattleImage } from './modules/Battle/battle_image.js';
import { init_battle_control } from './modules/Battle/battle_image_init.js';
import { set_up_character_creation_UI } from './modules/CharacterCreation/main.js';
import { set_up_character_model } from './modules/CharacterImage/main.js';
import { CharacterInfoCorner } from './modules/CharacterInfo/main.js';
import { CharacterScreen } from './modules/CharacterScreen/character_screen.js';
import { init_character_list_interactions } from './modules/CharactersList/main.js';
import { elementById, select, selectHTMLs } from './modules/HTMLwrappers/common.js';
import { init_market_items, market_items } from './modules/Market/items_market.js';
import { init_market_bulk_infrastructure, new_market_bulk, new_market_mini } from './modules/Market/market.js';
import { set_up_market_headers } from './modules/Market/market_header.js';
import { init_messages_interactions, new_log_message } from './modules/MessageBox/new_log_message.js';
import { init_skills } from './modules/Skills/main.js';
import { init_game_scene, login, reg } from './modules/ViewManagement/scene.js';
import { tab } from './modules/ViewManagement/tab.js';
import { socket } from "./modules/Socket/socket.js";
import { loadImages } from './modules/load_images.js';
import { draw_map_related_stuff, init_map } from './modules/Map/map.js';
import { init_detailed_character_statistics } from './request_perks.js';
import { globals } from './modules/globals.js';
import { AnimatedValue, Value, animated_values_storage } from './modules/Values/collection.js';
import { CraftBulkTemplate, CraftItemTemplate, EquipSlotData, EquipSocket, ItemBackpackData, TaggedCraftBulk, TaggedCraftItem } from '../shared/inventory.js';
import { new_craft_bulk, new_craft_item, new_craft_table, update_craft_item_div } from './modules/Craft/craft.js';
import { init_locations } from './modules/Locations/request_locations.js';
import { BulkOrderView, CraftItemUpdateView } from '@custom_types/responses.js';
import { CharacterDataBasic } from './modules/Types/character.js';
import { BackgroundImage } from './modules/BackgroundImage/background_image.js';
import { init_equipment_screen, init_equipment_screen_mini } from './modules/Equipment/equipment.js';
import { EquipSlotConfiguration, equip_slot_string_id } from "@content/content.js"
import { ms, seconds } from '@custom_types/battle_data.js';
import { List } from './widgets/List/list.js';
import { create_backpack_list, create_backpack_list_mini } from './modules/Equipment/backpack.js';

// noselect tabs

[...document.querySelectorAll(".noselect")].forEach( el =>
    el.addEventListener('contextmenu', e => e.preventDefault())
);

socket.on('connect', () => {
    console.log('connected')
    let tmp = localStorage.getItem('session');
    if ((tmp != null) && (tmp != 'null')) {
        socket.emit('session', tmp);
    }
})

init_authentication_control()
init_messages_interactions()
const informationCorner = new CharacterInfoCorner(socket);
const character_screen = new CharacterScreen(socket);
set_up_character_model(socket);
init_skills(socket);
set_up_character_creation_UI(socket);
set_up_market_headers()
init_detailed_character_statistics()
init_character_list_interactions()
init_market_items()
const locations_list = init_locations()
tab.turn_on('map')
const maps = init_map()
tab.turn_off('map')
init_game_scene(maps)
const background_image = new BackgroundImage(locations_list[0])

const equip_tables : (List<EquipSlotData>)[] = []
for (const container of selectHTMLs(".equip-display")) {
    equip_tables.push(init_equipment_screen(container, socket))
}
for (const container of selectHTMLs(".equip-display-mini")) {
    equip_tables.push(init_equipment_screen_mini(container))
}

const backpack_tables : (List<ItemBackpackData>)[] = []
for (const container of selectHTMLs(".backpack-display")) {
    backpack_tables.push(create_backpack_list(container))
}
for (const container of selectHTMLs(".backpack-display-mini")) {
    backpack_tables.push(create_backpack_list_mini(container))
}

const market_bulk = new_market_bulk();

const markets_mini : List<BulkOrderView>[] = [];

for (const container of selectHTMLs(".shop-display-mini")) {
    markets_mini.push(new_market_mini(container))
}

const craft_tables : (List<CraftBulkTemplate|CraftItemTemplate>)[] = []
for (const container of selectHTMLs(".craft-display")) {
    craft_tables.push(new_craft_table(container))
}


socket.on('craft-bulk-complete', (msg: TaggedCraftBulk) => {
    new_craft_bulk(craft_tables, msg);
});
socket.on('craft-item', (msg: CraftItemUpdateView) => {
    update_craft_item_div(craft_tables, msg);
});
socket.on('craft-item-complete', (msg: TaggedCraftItem) => {
    new_craft_item(craft_tables, msg);
});


socket.on("character_data", (msg: CharacterDataBasic) => {
    globals.character_data = {
        id: msg.id,
        name: msg.name,
        savings: new AnimatedValue(socket, "savings", [market_bulk, market_items, ... markets_mini]),
        savings_trade: new AnimatedValue(socket, "savings_trade", []),
        location_id: new Value(socket, "location_id", [background_image, ... locations_list]),
        stash: []
    }

    init_battle_control()

    for (const map of maps) {
        map.update_canvas_size()
    }

    socket.emit('request-tags');
    socket.emit('request-local-locations');
    socket.emit("request-map");
    socket.emit("request-battle-data");

    init_stash([market_bulk])
    init_market_bulk_infrastructure(market_bulk);
    socket.emit('request-craft');
    socket.emit('request-belongings');
})

socket.on('stash-update', msg => {
    // console.log('stash-update');
    // console.log(msg);
    update_stash(msg);
});

socket.on('log-message', msg => {
    if (msg == null) {
        return;
    }
    if (msg == 'you_are_dead') {
        tab.turn_off('battle');
    }

    new_log_message(msg)
});

socket.on('market-data', data => {
    market_bulk.data = data;
    for (const minimarket of markets_mini) {
        minimarket.data = data
    }
});

socket.on('is-reg-completed', msg => reg(msg));
socket.on('is-login-completed', msg => login(msg));
socket.on('session', msg => {localStorage.setItem('session', msg)})
socket.on('reset_session', () => {localStorage.setItem('session', 'null')})
socket.on('char-info-detailed', msg => character_screen.update(msg))
socket.on('equip-update', (msg: EquipSocket) => {
    // update_equip_image(msg.equip)
    //console.log('equip update')
    //console.log(msg)

    let equip_data : EquipSlotData[] = []
    for (let slot of Object.values(EquipSlotConfiguration.EQUIP_SLOT_SLOT_STRING)) {
        const item = msg.equip[slot]
        if (item == undefined) continue;
        equip_data.push({
            equip_slot: slot,
            item: item
        })
    }

    console.log("filtered equip data:")
    console.log(equip_data)

    for (const item of equip_tables) {
        item.data = equip_data
    }
    for (const item of backpack_tables) {
        item.data = msg.backpack.items
    }
});

// UI animations update loop
var delta = 0;
var previous: number|undefined = undefined
var current_tick = 0
var zero: number|undefined = undefined
// var FRAMES = 0

function draw(time: ms|number) {
    // FRAMES++;

    if (previous == undefined) {
        previous = time
    }
    if (zero == undefined) {
        zero = time
    }

    current_tick += time - previous
    if (current_tick > 15) {
        globals.now = Date.now()
        current_tick -= 15
        for (const value of animated_values_storage) {
            value.update_display()
        }
    }

    delta = (time - previous) / 1000 as seconds
    previous = time

    draw_map_related_stuff(maps, delta)

    if (elementById('actual_game_scene').style.visibility == 'visible') {
        if (!elementById('battle_tab').classList.contains('hidden')) {
            BattleImage.draw(delta as seconds);
        }
    }

    window.requestAnimationFrame(draw);
}


const images = loadImages(() => {
    //console.log(images);
    window.requestAnimationFrame(draw);
});
