// eslint-disable-next-line no-undef
var socket = io();

var prev_mouse_x = null;
var prev_mouse_y = null;

var SKILLS = {};

function get_pos_in_canvas(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
}

// document.getElementById('map').ondragstart = (event) => {
//     prev_mouse_x = null;
//     prev_mouse_y = null;
// }

// document.getElementById('map').ondrag = (event) => {
//     if (prev_mouse_x != null) {
//         var dx = event.pageX - prev_mouse_x;
//         var dy = event.pageY - prev_mouse_y;
//         map.move(dx, dy);
//     }
//     prev_mouse_x = event.pageX;
//     prev_mouse_y = event.pageY;
// }

document.getElementById('map').onmousemove = event => {
    var mouse_pos = get_pos_in_canvas(map.canvas, event);
    var hovered_hex = map.get_hex(mouse_pos.x, mouse_pos.y);
    map.hover_hex(hovered_hex[0], hovered_hex[1]);
};

document.getElementById('map').onmouseup = event => {
    let mouse_pos = get_pos_in_canvas(map.canvas, event);
    let selected_hex = map.get_hex(mouse_pos.x, mouse_pos.y);
    map.select_hex(selected_hex[0], selected_hex[1]);
}

function show(tag) {
    document.getElementById('battle_tab').style.visibility = 'hidden';
    document.getElementById('market_tab').style.visibility = 'hidden';
    document.getElementById('market_control_tab').style.visibility = 'hidden';
    document.getElementById('tactics_tab').style.visibility = 'hidden';
    document.getElementById('skilltree_tab').style.visibility = 'hidden';
    document.getElementById('map_tab').style.visibility = 'hidden';
    document.getElementById('character_screen').style.visibility = 'hidden';
    document.getElementById(tag).style.visibility = 'visible';
}

// function show(tag) {
//     document.getElementById('battle_tab').style.display = 'none';
//     document.getElementById('market_tab').style.display = 'none';
//     document.getElementById('market_control_tab').style.display = 'none';
//     document.getElementById('tactics_tab').style.display = 'none';
//     document.getElementById('skilltree_tab').style.display = 'none';
//     document.getElementById('map_tab').style.display = 'none';
//     document.getElementById('character_screen').style.display = 'none';
//     document.getElementById(tag).style.display = 'block';
// }

function show_game() {
    document.getElementById('login_container').style.visibility = 'hidden';
    document.getElementById('login-frame').style.visibility = 'hidden';
    document.getElementById('reg-frame').style.visibility = 'hidden';
    document.getElementById('game_container').style.visibility = 'visible';
    show('character_screen');
}

document.getElementById('open_reg_window_button').onclick = () => {
    document.getElementById('login-frame').style.visibility = 'hidden';
    document.getElementById('reg-frame').style.visibility = 'visible';
    document.getElementById('open_login_window_button').classList.remove('selected');
    document.getElementById('open_reg_window_button').classList.add('selected');
}

document.getElementById('open_login_window_button').onclick = () => {
    document.getElementById('reg-frame').style.visibility = 'hidden';
    document.getElementById('login-frame').style.visibility = 'visible';
    document.getElementById('open_reg_window_button').classList.remove('selected');
    document.getElementById('open_login_window_button').classList.add('selected');
}

document.getElementById('reg-frame').onsubmit = (event) => {
    event.preventDefault();
    let login = document.getElementById('login-r').value;
    let password = document.getElementById('password-r').value;
    socket.emit('reg', {login: login, password: password});
}

document.getElementById('login-frame').onsubmit = (event) => {
    event.preventDefault();
    let login = document.getElementById('login-l').value;
    let password = document.getElementById('password-l').value;
    socket.emit('login', {login: login, password: password});
}

document.getElementById('open_chat_button').onclick = () => {
    document.getElementById('log').style.visibility = 'hidden';
    document.getElementById('chat').style.visibility = 'visible';
    document.getElementById('open_log_button').classList.remove('selected');
    document.getElementById('open_chat_button').classList.add('selected');
}

document.getElementById('open_log_button').onclick = () => {
    document.getElementById('chat').style.visibility = 'hidden';
    document.getElementById('log').style.visibility = 'visible';
    document.getElementById('open_chat_button').classList.remove('selected');
    document.getElementById('open_log_button').classList.add('selected');
}

document.getElementById('send_message_button').onclick = (event) => {
    event.preventDefault();
    let message = document.getElementById('message_field').value;
    socket.emit('new-message', message);
}

document.getElementById('buy_form_con').onsubmit = (event) => {
    event.preventDefault();
    let tag = document.getElementById('buy_tag_select').value;
    let amount = document.getElementById('buy_amount').value;
    let money = document.getElementById('buy_money').value;
    let max_price = document.getElementById('buy_max_price').value;
    socket.emit('buy', {tag: tag,
                        amount: amount,
                        money: money,
                        max_price: max_price});
}

document.getElementById('sell_form_con').onsubmit = (event) => {
    event.preventDefault();
    let tag = document.getElementById('sell_tag_select').value;
    let amount = document.getElementById('sell_amount').value;
    let price = document.getElementById('sell_price').value;
    socket.emit('sell', {tag: tag,
                         amount: amount,
                         price: price});
}


let market_actions = document.getElementById('market_actions');

this.button = document.createElement('button');
(() => 
        this.button.onclick = () => socket.emit('sell', {tag: 'meat', amount: '1', price: '100'})
)();
this.button.innerHTML = 'SELL 1 MEAT FOR 100';
market_actions.appendChild(this.button);

this.button = document.createElement('button');
(() => 
        this.button.onclick = () => socket.emit('buy', {tag: 'food', amount: '1', money: '150', max_price: '100'})
)();
this.button.innerHTML = 'BUY 1 FOOD FOR 150';
market_actions.appendChild(this.button);

this.button = document.createElement('button');
(() => 
        this.button.onclick = () => socket.emit('buy', {tag: 'water', amount: '1', money: '100', max_price: '100'})
)();
this.button.innerHTML = 'BUY 1 WATER FOR 100';
market_actions.appendChild(this.button);



document.getElementById('attack_button').onclick = () => {
    socket.emit('send-market-data', false)
    show('battle_tab');
}

document.getElementById('attack').onclick = () => {
    socket.emit('attack', null);
}
document.getElementById('market_button').onclick = () => {
    socket.emit('send-market-data', true)
    show('market_tab');
}
document.getElementById('market_control_button').onclick = () => {
    socket.emit('send-market-data', false)
    show('market_control_tab');
}
document.getElementById('map_button').onclick = () => {
    socket.emit('send-market-data', false)
    show('map_tab');
}
document.getElementById('tactics_button').onclick = () => {
    socket.emit('send-market-data', false)
    show('tactics_tab');
}
document.getElementById('skilltree_button').onclick = () => {
    socket.emit('send-market-data', false)
    show('skilltree_tab');
}
document.getElementById('character_screen_button').onclick = () => {
    socket.emit('send-market-data', false);
    socket.emit('char-info-detailed');
    show('character_screen');
}


socket.on('tags', msg => update_tags(msg));
socket.on('is-reg-valid', msg => my_alert(msg));
socket.on('is-reg-completed', msg => reg(msg));
socket.on('is-login-valid', msg => my_alert(msg));
socket.on('is-login-completed', msg => login(msg));
socket.on('log-message', msg => new_log_message(msg));
socket.on('new-message', msg => new_message(msg));
socket.on('hp', msg => char_info_monster.update_hp(msg));
socket.on('exp', msg => char_info_monster.update_exp(msg));
socket.on('savings', msg => char_info_monster.update_savings(msg));
socket.on('status', msg => char_info_monster.update_status(msg));
socket.on('name', msg => char_info_monster.update_name(msg));
socket.on('market-data', data => market_table.update(data));
socket.on('skill-tree', data => {SKILLS = data});
socket.on('tags-tactic', msg => tactic_screen.update_tags(msg));
socket.on('char-info-detailed', msg => character_screen.update(msg))
socket.on('alert', msg => alert(msg));
socket.on('skills', msg => skill_tree.update(SKILLS, msg));
socket.on('tactic', msg => tactic_screen.update(msg));
socket.on('map-pos', msg => {console.log(msg); map.set_curr_pos(msg.x, msg.y)});

socket.on('battle-has-started', data => {
    battle_image.clear()
    console.log(data)
    battle_image.load(data)
})

socket.on('battle-update', data => {
    battle_image.update(data)
})

socket.on('battle-action', data => {
    if (data == null) {
        return
    }
    console.log(data)
    battle_image.update_action(data)
    if (data.action == 'attack') {
        if (data.result.crit) {
            new_log_message(data.actor_name + ': critical_damage')
        }
        new_log_message(data.actor_name + ': deals ' + data.result.total_damage + ' damage')
    }    
})


function update_tags(msg) {
    for (var tag of msg) {
        var tag_option = new Option(tag, tag);
        document.getElementById('buy_tag_select').add(tag_option);
        tag_option = new Option(tag, tag);
        document.getElementById('sell_tag_select').add(tag_option);
    }
}

function my_alert(msg) {
    if (msg != 'ok') {
        alert(msg);
    }
}

function login(msg) {
    if (msg != 'ok') {
        alert(msg);
    } else if (msg == 'ok') {
        show_game();
    }
}

function reg(msg) {
    if (msg != 'ok') {
        alert(msg);
    } else if (msg == 'ok') {
        show_game();
    }
}

function new_log_message(msg) {
    var log = document.getElementById('log');
    var new_line = document.createElement('p');
    var text = document.createTextNode(msg);
    new_line.append(text);
    log.appendChild(new_line);
    log.scrollTop = log.scrollHeight
}

function new_message(msg) {
    if (msg != 'message-too-long') {
        var chat = document.getElementById('chat');
        var new_line = document.createElement('p');
        var text = document.createTextNode(msg.user + ': ' + msg.msg);
        new_line.append(text);
        chat.appendChild(new_line);
        chat.scrollTop = chat.scrollHeight
    }
}


class CharInfoMonster {
    constructor() {
        this.table = document.createElement('table');

        this.name = this.insert_row('name');
        this.hp = this.insert_row('hp');

        this.exp = this.insert_row('exp');        
        this.level = this.insert_row('level');
        this.points = this.insert_row('points');

        this.savings = this.insert_row('savings');

        this.rage = this.insert_row('rage');
        this.blood = this.insert_row('blood');
        this.stress = this.insert_row('stress');

    }

    insert_row(s) {
        let row = this.table.insertRow();
        let label = row.insertCell(0);
        label.innerHTML = s
        return row.insertCell(1);
    }

    update_name(data) {
        this.name.innerHTML = data;
    }

    update_hp(data) {
        this.hp.innerHTML = `${data.hp}/${data.mhp}`
    }

    update_exp(data) {
        this.exp.innerHTML = data.exp;
        this.level.innerHTML = data.level;
        this.points.innerHTML = data.points;
    }

    update_savings(savings) {
        console.log('savings', savings);
        this.savings.innerHTML = savings;
    }

    update_status(data) {
        this.rage.innerHTML = data.rage;
        this.blood.innerHTML = data.blood_covering;
        this.stress.innerHTML = data.stress;
        char_image.update(data.rage, data.blood_covering, undefined)
    }
}
const char_info_monster = new CharInfoMonster();
let status_page = document.getElementById('status')
status_page.appendChild(char_info_monster.table);




// eslint-disable-next-line no-undef
var char_image = new CharacterImage(document.getElementById('char_image'));
// eslint-disable-next-line no-undef
var battle_image = new BattleImage(document.getElementById('battle_canvas'), document.getElementById('battle_canvas_background'));
// eslint-disable-next-line no-undef
var market_table = new MarketTable(document.getElementById('market'));
socket.emit('get-market-data', null);
// eslint-disable-next-line no-undef
var map = new Map(document.getElementById('map'), document.getElementById('map_control'), socket);
// eslint-disable-next-line no-undef
var skill_tree = new SkillTree(document.getElementById('skilltree'), socket);
// eslint-disable-next-line no-undef
var tactic_screen = new TacticScreen(document.getElementById('tactic'), socket);
// eslint-disable-next-line no-undef
var character_screen = new CharacterScreen(document.getElementById('character_screen'), socket);

var currentTime = (new Date()).getTime(); var lastTime = (new Date()).getTime();
var delta = 0;

function draw(time) {
    currentTime = (new Date()).getTime();
    delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (document.getElementById('game_container').style.visibility == 'visible') {
        char_image.draw(time);
        if (document.getElementById('battle_tab').style.visibility != 'hidden') {
            battle_image.draw(delta);
        }
        if (document.getElementById('map_tab').style.visibility != 'hidden'){
            map.draw(time);
        }
    }
    window.requestAnimationFrame(draw);
}


const images = loadImages(images_list[0], images_list[1], () => { console.log(images), window.requestAnimationFrame(draw);});