import { globals } from './modules/globals.js';
import { socket } from "./modules/Socket/socket.js";
import { CharacterStatsResponse, PerksResponse } from '../shared/responses.js'
import { money } from '../shared/common.js';
import { elementById } from './modules/HTMLwrappers/common.js';
import { EQUIP_SLOT, EquipSlotStorage, MATERIAL, MaterialConfiguration, MaterialStorage, PERK, PerkConfiguration, PerkStorage, SKILL, SkillConfiguration, SkillStorage, equip_slot_string_id } from '@content/content.js';
import { EQUIPMENT_TAGS } from "./modules/CharacterImage/equip_strings.js";


// export const slots_front_end = ['weapon', 'secondary', 'amulet', 'mail', 'greaves', 'left_pauldron', 'right_pauldron', 'left_gauntlet', 'right_gauntlet', 'boots', 'helmet', 'belt', 'robe', 'shirt', 'pants'] as const


// tmp.typ = this.typ;
// tmp.tag = this.tag;
// tmp.owner_id = this.owner_id;
// if (this.owner != undefined) {
//     tmp.owner_name = this.owner.name;
//     tmp.owner_tag = this.owner.get_tag;
// }
// tmp.amount = this.amount;
// tmp.price = this.price;
// tmp.id = this.id;
// perks related
function request_perks() {
    socket.emit('request-talk', globals.selected_character);
}

function close_perks() {
    let big_div = document.getElementById('backdrop')!;
    big_div.classList.add('hidden');
    document.getElementById('dialog-scene')?.classList.add('hidden');
}
function send_perk_learning_request(i: PERK) {
    return () => socket.emit('learn-perk', { tag: i, id: globals.selected_character });
}
function request_prices() {
    return () => socket.emit('request-prices-character', globals.selected_character);
}
function send_skill_learning_request(i: SKILL) {
    return () => socket.emit('learn-skill', { tag: i, id: globals.selected_character });
}
function buy_land_plot_request() {
    return () => {
        console.log(
            'buy plot',
            globals.selected_character
        )
        socket.emit('buy-plot', { id: globals.selected_character })
    }
}

function epitet(number: number) {
    if (number >= 90) {
        return 'master'
    }
    if (number >= 70) {
        return 'expert'
    }
    if (number >= 50) {
        return 'competent'
    }
    if (number >= 30) {
        return 'mediocre'
    }
    return 'novice'
}


function clear_dialog_options() {
    let dialog_options_div = document.getElementById('dialog-options')!;
    dialog_options_div.innerHTML = '';
}

function add_dialog_option(i: string, onclick: () => void) {
    let dialog_options_div = document.getElementById('dialog-options')!;

    let div = document.createElement('div');
    div.innerHTML = i;
    div.onclick = onclick;
    div.classList.add(... ["dialog-content", "dialog-option"])
    dialog_options_div.appendChild(div);
}

function generate_greeting(data: PerksResponse) {
    let greeting_line = `Hello, I am ${data.name} of ${data.race} race. I am currently ${data.current_goal}. `
    let flag = true
    for (let faction_block of data.factions) {
        if (faction_block.reputation != 'neutral') {
            flag = false
            greeting_line += `I am ${faction_block.reputation} of ${faction_block.faction_name}. `
        }
    }

    if (flag) {
        greeting_line += ('I am not related to any local faction. ')
    }

    if (Object.keys(data.skills).length == 0) {
        greeting_line += ('I have no particular skills. ')
    } else {
        for (let skill of SkillConfiguration.SKILL) {
            let temp = data.skills[skill]
            if (temp == undefined) continue

            let [level, price] = temp
            greeting_line += `I am ${epitet(level)} at ${SkillStorage.get(skill).name}. `
        }
        greeting_line += `I can teach you for a price. `
    }
    return greeting_line
}

function url(layer: string, tag_slot: string, tag_item: string, race: string) {
    return `url(/static/img/character_image/${race}/${tag_slot}/${tag_item}_${layer}.PNG)`
}

function build_portrait(div: Element, data: {[tag in EQUIP_SLOT]?: string}, model: string) {
    let string = ''

    for (let tag of EQUIPMENT_TAGS.slice().reverse()) {
        let item_tag = data[EquipSlotStorage.from_string(tag).id]
        if (item_tag != undefined)
            string += `no-repeat ${url('on_top', tag, item_tag, model)} top center/cover, `
    }
    string += `no-repeat url(/static/img/character_image/${model}/right_arm.PNG) top center/cover, `
    for (let tag of EQUIPMENT_TAGS.slice().reverse()) {
        let item_tag = data[EquipSlotStorage.from_string(tag).id]
        if (item_tag != undefined)
            string += `no-repeat ${url('behind_right_arm', tag, item_tag, model)} top center/cover, `
    }
    string += `no-repeat url(/static/img/character_image/${model}/body.PNG) top center/cover, `
    for (let tag of EQUIPMENT_TAGS.slice().reverse()) {
        let item_tag = data[EquipSlotStorage.from_string(tag).id]
        if (item_tag != undefined)
            string += `no-repeat ${url('behind_body', tag, item_tag, model)} top center/cover, `
    }
    string += `no-repeat url(/static/img/character_image/${model}/left_arm.PNG) top center/cover, `
    for (let tag of EQUIPMENT_TAGS) {
        let item_tag = data[EquipSlotStorage.from_string(tag).id]
        if (item_tag != undefined)
            string += `no-repeat ${url('behind_all', tag, item_tag, model)} top center/cover, `
    }
    string += `no-repeat url(/static/img/character_image/${model}/pose.png) top center/cover`
    console.log(string);
    (<HTMLElement>div).style.background = string;
}

function is_leader(data: PerksResponse) {
    for (let faction of data.factions) {
        if (faction.reputation == 'leader') {
            return true
        }
    }
    return false
}

function build_dialog(data: PerksResponse) {
    console.log('build perks');
    console.log(data);
    let big_div = document.getElementById('backdrop')!;
    let portrait_div = big_div.querySelector('.character-display')!
    document.getElementById('dialog-message')!.innerHTML = generate_greeting(data);
    clear_dialog_options();
    build_portrait(portrait_div, data.equip, data.model)
    add_dialog_option('Goodbye', close_perks)
    add_dialog_option('What do you think about current prices?', request_prices())

    if (is_leader(data)) add_dialog_option('I want to buy a land plot for 500.', buy_land_plot_request())

    for (const perk of PerkConfiguration.PERK) {
        if (data.perks[perk] == undefined) continue
        add_dialog_option(`Teach me ${PerkStorage.get(perk).name} for ${data.perks[perk]}`, send_perk_learning_request(perk))
    }
    for (let skill of SkillConfiguration.SKILL) {
        let tmp = data.skills[skill]
        if (tmp == undefined) continue
        let [level, price] = tmp
        add_dialog_option(`Teach me ${SkillStorage.get(skill).name} for ${price}`, send_skill_learning_request(skill))
    }
    big_div.classList.remove('hidden');
    document.getElementById('dialog-scene')?.classList.remove('hidden');
}

function convert_prices_data_to_string(data: {
    buy: Record<MATERIAL, money>,
    sell: Record<MATERIAL, money>,
    buy_log_precision: Record<MATERIAL, money>,
    sell_log_precision: Record<MATERIAL, money>
}) {
    let buy_string = "I think one could buy the following goods with these prices: <br>"

    for (const material of MaterialConfiguration.MATERIAL) {
        const value = data.buy[material]
        const deviation = Math.floor(1 / Math.exp(data.buy_log_precision[material]))
        buy_string += `${MaterialStorage.get(material).name}: ${value} +- ${deviation} <br>`
    }

    let sell_string = "I think one could sell the following goods with these prices: <br>"

    for (const material of MaterialConfiguration.MATERIAL) {
        const value = data.sell[material]
        const deviation = Math.floor(1 / Math.exp(data.sell_log_precision[material]))
        sell_string += `${MaterialStorage.get(material).name}: ${value} +- ${deviation} <br>`
    }

    return buy_string + sell_string
}

function build_prices(data: {
    buy: Record<MATERIAL, money>,
    sell: Record<MATERIAL, money>,
    buy_log_precision: Record<MATERIAL, money>,
    sell_log_precision: Record<MATERIAL, money>
}) {
    console.log('prices_data')
    console.log(data)

    clear_dialog_options();

    document.getElementById('dialog-message')!.innerHTML = convert_prices_data_to_string(data);

    add_dialog_option('Thanks you, let\'s talk about something else', request_perks)
    add_dialog_option('Goodbye', close_perks)
}

function update_perks(data: PERK) {
    // console.log('PERKS!!!!');
    // console.log(data);
    let div2 = document.getElementById('perks_tab')!;
    div2.innerHTML = '';
    for (let tag of Object.keys(data)) {
        console.log(tag);
        let div = document.createElement('div');
        div.innerHTML = tag;
        div2.append(div);
    }
}

function flex_something(s: string, w: string) {
    const item = document.createElement('div')
    item.classList.add('container-horizontal')

    const label = document.createElement('div')
    label.classList.add('flex-2')
    label.innerHTML = s

    const data = document.createElement('div')
    data.classList.add('flex-1')
    data.innerHTML = w

    item.appendChild(label)
    item.appendChild(data)

    return item
}

function update_stats(data: CharacterStatsResponse) {
    const stats_tab = document.getElementById('stats_tab')!
    stats_tab.innerHTML = ''

    stats_tab.appendChild(flex_something(`Physical power: `,                `${data.phys_power}`))
    stats_tab.appendChild(flex_something(`Magic power: `,                   `${data.magic_power}`))
    stats_tab.appendChild(flex_something(`Enchant rating: `,                `${data.enchant_rating.toFixed(2)}`))
    stats_tab.appendChild(flex_something(`Cost of battle movement: `,       `${data.movement_cost.toFixed(2)}`))
    stats_tab.appendChild(flex_something(`Movement duration: `,             `${data.move_duration_map.toFixed(2)}`))
    stats_tab.appendChild(flex_something(`Magic bolt base damage `,         `${data.base_damage_magic_bolt.toFixed(2)}`))
    stats_tab.appendChild(flex_something('Charged magic bolt base damage',  `${data.base_damage_magic_bolt_charged.toFixed(2)}`))
}

export function init_detailed_character_statistics() {
    elementById('request_perks_selected_charater').onclick = request_perks;
    elementById('close_perks').onclick = () => close_perks();

    socket.on('perks-info',     build_dialog);
    socket.on('character-prices', build_prices);
    socket.on('perks-update',   update_perks);
    socket.on('stats',          update_stats)
}

