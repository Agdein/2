import { SocketWrapper, User, UserData } from "./user";
var bcrypt = require('bcryptjs');
var salt = process.env.SALT;

import { ARMOUR, WEAPON } from "@content/content";
import { TEMP_character_id } from "@custom_types/common";
import { character_id, user_id, user_online_id } from "@custom_types/ids";
import fs from "fs";
import { SAVE_GAME_PATH } from "../../SAVE_GAME_PATH";
import { DataID } from "../data/data_id";
import { Data } from "../data/data_objects";
import { Character } from "../data/entities/character";
import { EventInventory } from "../events/inventory_events";
import { Convert, Link } from "../systems_communication";
import { Template } from "../templates";
import { ModelVariant } from "../types";
import { UI_Part, Update } from "./causality_graph";
import { Alerts } from "./network_actions/alerts";
import { SendUpdate } from "./network_actions/updates";
var path = require('path')

type LoginResponse = {login_prompt: 'wrong-login', user: undefined}|{login_prompt: 'wrong-password', user: undefined}|{login_prompt: 'ok', user: User}
type RegResponse = {reg_prompt: 'login-is-not-available', user: undefined}|{reg_prompt: 'ok', user: User}


export type UsersData = {[_ in user_id]: UserData}
export type UsersOnline = {[_: user_online_id]: User}

export var users_data_dict: UsersData                           = {}
var users_data_list: UserData[]                                 = []
var login_to_user_data: {[login: string]: UserData|undefined}   = {}
export var users_online_dict: UsersOnline                       = {}
var users_to_update: Set<User>                                  = new Set()

var last_id = 0

const save_path = path.join(SAVE_GAME_PATH, 'users.txt')

export namespace UserManagement {

    export function load_users() {
        console.log('loading users')
        if (!fs.existsSync(save_path)) {
            fs.writeFileSync(save_path, '')
        }
        let data = fs.readFileSync(save_path).toString()
        let lines = data.split('\n')

        for (let line of lines) {
            if (line == '') {continue}
            let data = line.split(' ')
            console.log(data)

            let character_id:character_id|TEMP_character_id = '@'
            if (data[1] != '@') {
                character_id = Number(data[1]) as character_id
            }

            let user = new UserData(Number(data[0]), character_id, data[2], data[3], data[4] == 'true')
            users_data_dict[user.id] = user
            login_to_user_data[user.login] = user
            users_data_list.push(user)

            if (user.id > last_id) {
                last_id = user.id
            }
        }
        console.log('users are loaded')
    }

    export function save_users() {
        console.log('saving users')
        let str:string = ''
        for (let item of users_data_list) {
            str = str + item.id + ' ' + item.character_id + ' ' + item.login + ' ' + item.password_hash + ' ' + item.tester_account + '\n'
        }
        fs.writeFileSync(save_path, str)
        console.log('users saved')
    }

    export function log_out(sw: SocketWrapper) {
        if (sw.user_id == undefined) return
        users_online_dict[sw.user_id].logged_in = false
    }

    export function link_socket_wrapper_and_user(sw: SocketWrapper, user: User) {
        user.socket = sw.socket
        sw.user_id = user.data.id as user_online_id
        user.logged_in = true
    }

    export function construct_user(sw: SocketWrapper, data: UserData) {
        console.log('constructing online user ' + data.id)
        let user = new User(sw.socket, data)
        sw.user_id = user.data.id as user_online_id
        users_online_dict[sw.user_id] = user;
        save_users()
        return user
    }

    function construct_user_data(character_id: character_id|TEMP_character_id, login: string, hash: string, tester_flag: boolean) {
        last_id = (last_id + 1)
        let user_data = new UserData(last_id, character_id, login, hash, tester_flag)
        users_data_dict[last_id as user_id] = user_data
        login_to_user_data[login] = user_data
        users_data_list.push(user_data)

        return user_data
    }

    export function login_user(sw: SocketWrapper, data: {login: string, password: string}): LoginResponse {
        // check that user exists
        let user_data = login_to_user_data[data.login]
        if (user_data == undefined) {
            return {login_prompt: 'wrong-login', user: undefined};
        }

        // compare hash of password with hash in storage
        var password_hash = user_data.password_hash;
        let response =  bcrypt.compareSync(data.password, password_hash)
        if (response) {
            var user = construct_user(sw, user_data)
            user.logged_in = true
            return({login_prompt: 'ok', user: user});
        }
        return {login_prompt: 'wrong-password', user: undefined};
    }

    export function register_user(sw: SocketWrapper, data: {login: string, password: string, code?: string}):RegResponse {
        if (login_to_user_data[data.login] != undefined) {
            return {reg_prompt: 'login-is-not-available', user: undefined};
        }

        // console.log(data)
        // console.log(data.code)
        // console.log(process.env.TESTER_CODE)

        let hash = bcrypt.hashSync(data.password, salt)
        let user_data = construct_user_data('@', data.login, hash, (data.code == process.env.TESTER_CODE)&&(data.code != undefined))
        let user = construct_user(sw, user_data)
        user.logged_in = true
        return({reg_prompt: 'ok', user: user});
    }

    export function user_exists(id: number) {
        if (users_data_dict[id as user_id] == undefined) {
            return false
        }
        return true
    }

    export function user_was_online(id: number) {
        let x = users_online_dict[id as user_online_id]
        if (x == undefined) return false
        return true
    }

    export function user_is_online(id: number) {
        let x = users_online_dict[id as user_online_id]
        if (x == undefined) return false
        if (!x.logged_in) return false
        return true
    }

    export function get_user(id: user_online_id) {
        return users_online_dict[id]
    }

    export function get_user_data(id: user_id) {
        return users_data_dict[id]
    }

    export function get_new_character(id: user_id, name: string, model_variation: ModelVariant, faction: string) {
        let user = get_user_data(id)
        if (user.character_id != '@') {
            console.log('attempt to generate character for user who already owns one')
            return
        }

        var character:Character|undefined = undefined
        console.log(faction)

// steppe_humans 9 9
// city 2 6
// rats 12 16
// graci 17 13
// elodino_free 24 20
// big_humans 10 28

        let spawn_point = DataID.Faction.spawn(faction)
        if (spawn_point == undefined) return
        switch(faction){
            case "city":{
                character = Template.Character.HumanCity(name);
                if (user.tester_account) {
                    let item = Data.Items.create_weapon_simple(WEAPON.SWORD_STEEL);
                    EventInventory.add_item(character, item.id)

                    let boots = Data.Items.create_armour_simple(ARMOUR.BOOTS_LEATHER_RAT);
                    boots.durability = 175
                    EventInventory.add_item(character, boots.id)
                }
                break
            };
            case "big_humans":{character = Template.Character.HumanStrong(spawn_point, name);break};
            case "rats":{character = Template.Character.BigRat( name);break;}
            case "graci":{character = Template.Character.Graci(name);break}
            case "elodino_free":{character = Template.Character.MageElo(name);break}
            case "steppe_humans":{character = Template.Character.HumanSteppe(name);break}
        }

        if (character == undefined) return;
        console.log('user ' + user.login + ' gets new character: ' + character.get_name() + '(id:' + character.id + ')')
        Link.character_and_user_data(character, user)

        const real_user = get_user(id as user_online_id)
        if (real_user != undefined) {real_user.character_removed = false}
        // save_users()
    }

    export function add_user_to_update_queue(id: user_id|undefined, reason:'character_creation'|UI_Part|'character_removal') {
        if (id == undefined) return
        let user = get_user(id as user_online_id)
        if (user == undefined) return
        if (reason == 'character_creation') {user.character_created = true} else
        if (reason == 'character_removal')  {user.character_removed = true} else {
            Update.on(user.updates, reason)
        }

        //console.log("update scheduled", reason)
        users_to_update.add(user)
    }



    export function update_users() {
        // console.log('update loop')
        for (let item of users_to_update) {
            // console.log('send_update to ' + item.data.login)
            if (item.character_created) {
                send_character_to_user(item)
                item.character_created = false
            } if(item.character_removed) {
                Alerts.character_removed(item)
            } else {
                Update.update_root(item)
                item.updates = Update.construct()
            }
        }
        users_to_update.clear()
    }

    export function send_character_to_user(user: User) {
        Alerts.generic_user_alert(user, 'character_exists', undefined)

        SendUpdate.all(user)
        Update.update_root(user)


        const character = Convert.user_to_character(user)



        if (character == undefined) return

        Alerts.generic_user_alert(user, "character_data", {name: character.name, id: character.id})

        Alerts.enter_room(character)
        const battle = Convert.character_to_battle(character)
        if (battle != undefined) {
            Alerts.battle_to_character(battle, character)
        }
        Alerts.generic_user_alert(user, 'loading_completed', '')
    }
}