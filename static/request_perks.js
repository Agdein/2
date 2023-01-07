import { socket, globals } from './modules/globals.js';

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
    socket.emit('request-perks', globals.selected_character);
}
{
    let button = document.getElementById('request_perks_selected_charater');
    button.onclick = request_perks;
}
{
    let button = document.getElementById('close_perks');
    button.onclick = () => close_perks();
}
function close_perks() {
    let big_div = document.getElementById('available_perks');
    big_div.classList.add('hidden');
}
function send_perk_learning_request(i) {
    return () => socket.emit('learn-perk', { tag: i, id: globals.selected_character });
}
function build_perks_list(data) {
    console.log('build perks');
    console.log(data);
    let big_div = document.getElementById('available_perks');
    let div_for_a_list = document.getElementById('perks_for_learning');

    div_for_a_list.innerHTML = '';

    for (let i in data) {
        let list_entry = document.createElement('div');

        let label = document.createElement('div');
        label.innerHTML = i;
        list_entry.appendChild(label);

        let button = document.createElement('button');
        button.onclick = send_perk_learning_request(i);
        button.innerHTML = 'learn (' + data[i] + ')';
        list_entry.appendChild(button);

        div_for_a_list.appendChild(list_entry);
    }

    big_div.classList.remove('hidden');
}
function update_perks(data) {
    console.log('PERKS!!!!');
    console.log(data);
    let div2 = document.getElementById('perks_tab');
    div2.innerHTML = '';
    for (let tag in data) {
        console.log(tag);
        let div = document.createElement('div');
        div.innerHTML = tag;
        div2.append(div);
    }
}
socket.on('perks-info', (msg) => { build_perks_list(msg); });
socket.on('perks-update', (msg) => { update_perks(msg); });
