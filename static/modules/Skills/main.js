import { SkillConfiguration, SkillStorage } from "../.././content.js";
import { set_up_header_with_strings } from "../../headers.js";
import { elementById, resetInnerHTMLById } from "../HTMLwrappers/common.js";
import { BarValue, value_bar_class_name, value_class_name } from "../Values/collection.js";
var STATE = {};
export function init_skills(socket) {
    load_skill_tags(socket);
    set_up_header_with_strings([
        { element: 'skills_header', connected_element: 'skills_tab' },
        { element: 'perks_header', connected_element: 'perks_tab' },
        { element: 'stats_header', connected_element: 'stats_tab' }
    ]);
}
function load_skill_tags(socket) {
    console.log('load skills');
    resetInnerHTMLById("skills_tab");
    let box = elementById("skills_tab");
    for (let tag of SkillConfiguration.SKILL) {
        let div = build_skill_div(SkillStorage.get(tag).id_string);
        box.appendChild(div);
        STATE[tag] = new BarValue(socket, SkillStorage.get(tag).id_string, []);
        STATE[tag].max_value = 100;
    }
}
function build_skill_div(tag) {
    console.log("adding skill: " + tag);
    let skill_div = document.createElement('div');
    skill_div.id = tag + '_skill_div';
    let practice_bar_container = document.createElement('div');
    {
        practice_bar_container.classList.add('hbar');
        let practice_bar = document.createElement('span');
        practice_bar.classList.add(value_bar_class_name(tag));
        practice_bar_container.appendChild(practice_bar);
        let name_label = document.createElement('div');
        name_label.classList.add('label');
        name_label.innerHTML = SkillStorage.from_string(tag).name;
        practice_bar_container.appendChild(name_label);
    }
    skill_div.appendChild(practice_bar_container);
    let practice_number = document.createElement('div');
    practice_number.classList.add('practice_n');
    practice_number.classList.add(value_class_name(tag));
    practice_number.innerHTML = '...';
    skill_div.appendChild(practice_number);
    return skill_div;
}

