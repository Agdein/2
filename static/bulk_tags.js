import { socket } from './modules/globals.js';
export var stash_tag_to_id = {};
export var stash_id_to_tag = {};
export function update_tags(msg) {
    console.log("TAAAAAAGS");
    console.log(msg);
    let inventory_div = document.getElementById('goods_stash');
    let material_select = document.getElementById('create_order_material');
    inventory_div.innerHTML = '';
    material_select.innerHTML = '';
    stash_tag_to_id = msg;
    console.log(stash_tag_to_id);
    for (let tag of Object.keys(msg)) {
        stash_tag_to_id[tag] = msg[tag];
        stash_id_to_tag[msg[tag]] = tag;
    }
    for (var tag in msg) {
        {
            // stash
            let div_cell = document.createElement('div');
            div_cell.classList.add('goods_type_stash');
            div_cell.classList.add('tooltip');
            div_cell.classList.add(tag);
            ((tag) => div_cell.onclick = () => { process_stash_click(tag); })(tag);
            {
                let div_image = document.createElement('div');
                div_image.classList.add('goods_icon');
                div_image.style.background = "no-repeat right/contain url(/static/img/stash_" + tag + ".png)";
                div_cell.appendChild(div_image);
            }
            {
                let div_text = document.createElement('span');
                div_text.innerHTML = tag;
                div_text.classList.add('tooltiptext');
                div_cell.appendChild(div_text);
            }
            {
                let div = document.createElement('div');
                div.innerHTML = '?';
                div.classList.add('goods_amount_in_inventory');
                div_cell.appendChild(div);
            }
            inventory_div.appendChild(div_cell);
            let option = document.createElement('option');
            option.value = msg[tag].toString();
            option.innerHTML = tag;
            material_select.appendChild(option);
        }
    }
}
export function update_savings(msg) {
    document.getElementById('savings').innerHTML = 'Money: ' + msg;
}
export function update_savings_trade(msg) {
    document.getElementById('savings_trade').innerHTML = 'Money reserved in trade: ' + msg;
}
export function update_stash(data) {
    console.log("STAAAAASH");
    console.log(data);
    for (let tag in stash_id_to_tag) {
        let stash = document.getElementById('goods_stash');
        // console.log(tag, stash_id_to_tag[tag])
        let div = stash.querySelector('.' + stash_id_to_tag[tag] + ' > .goods_amount_in_inventory');
        if (div != null) {
            div.innerHTML = (data[tag] || 0).toString();
        }
    }
}
export function process_stash_click(tag) {
    console.log(tag);
    if (tag == 'food') {
        socket.emit('eat');
    }
}
