import { socket } from "../Socket/socket.js";
import { List } from "../../widgets/List/list.js";
import { elementById } from "../HTMLwrappers/common.js";
const columns = [
    {
        header_text: "Type",
        type: "string",
        value(item) {
            return item.type;
        },
        custom_style: ["flex-1-0-5"]
    },
    {
        header_text: "Select",
        type: "string",
        value(item) {
            return "Select";
        },
        onclick: (item) => display_building_data(item),
        viable: (item) => true,
        custom_style: ["flex-1-0-5"]
    },
    {
        header_text: "Enter price",
        type: "number",
        value: (item) => item.room_cost,
        custom_style: ["flex-1-0-5"]
    },
    {
        header_text: "Owner",
        type: "string",
        value: (item) => item.owner_name,
        custom_style: ["flex-1-0-5"]
    }
];
const locations_list = new List(elementById("location-list"));
locations_list.columns = columns;
export function init_buildings() {
    {
        let div = document.getElementById('local_buildings');
        let close_button = document.getElementById('buildings-close-button');
        close_button.onclick = () => close_buildings();
    }
    {
        document.getElementById('claim-land-plot').onclick = create_plot;
        // document.getElementById('change-price-room')!.onclick
        // document.getElementById('build-shack')
    }
    socket.on('buildings-info', (data) => {
        locations_list.data = data;
    });
}
function create_plot() {
    socket.emit('create-plot');
}
function close_buildings() {
    let big_div = document.getElementById('local_buildings');
    big_div.classList.add('hidden');
    document.getElementById('backdrop').classList.add('hidden');
}
function rent_room(id) {
    return function () {
        socket.emit('rent-room', { id: id });
    };
}
function change_price(id) {
    return function () {
        const price = parseInt(document.getElementById('building-rent-price-input').value);
        if (price == undefined)
            return;
        console.log('change-rent-price', { id: id, price: price });
        socket.emit('change-rent-price', { id: id, price: price });
    };
}
function repair_building(id) {
    return function () {
        socket.emit('repair-building', { id: id });
    };
}
function build_house(id) {
    return function () {
        socket.emit('build-building', { id: id, type: "human_house" /* LandPlotType.HumanHouse */ });
    };
}
function build_inn(id) {
    return function () {
        socket.emit('build-building', { id: id, type: "inn" /* LandPlotType.Inn */ });
    };
}
function build_shack(id) {
    return function () {
        socket.emit('build-building', { id: id, type: "shack" /* LandPlotType.Shack */ });
    };
}
// function build_building(type: LandPlotType) {
//     return function() {
//         socket.emit('build-building', type)
//     }
// }
function quality_to_name(n) {
    if (n < 30)
        return 'crumbling ' + '(' + n + ')';
    if (n < 60)
        return '' + '(' + n + ')';
    if (n < 90)
        return 'fine' + '(' + n + ')';
    return 'sturdy' + '(' + n + ')';
}
function type_to_name(x) {
    // if (n == 1) return 'shack'
    // if (n == 2) return 'house'
    // if (n == 3) return 'mansion'
    // if (n == 4) return 'palace'
    return x;
}
function display_building_data(b) {
    return () => {
        let image_container = elementById("selected-location-image");
        if (b.type == "human_house" /* LandPlotType.HumanHouse */) {
            image_container.style.backgroundImage = 'url("/static/img/buildings/house.png")';
        }
        else if (b.type == "inn" /* LandPlotType.Inn */) {
            image_container.style.backgroundImage = 'url("/static/img/buildings/house.png")';
        }
        else if (b.type == "forest_plot" /* LandPlotType.ForestPlot */) {
            image_container.style.backgroundImage = 'url("/static/img/buildings/forest.png")';
        }
        else {
            image_container.innerHTML = type_to_name(b.type);
        }
        // const owner_div = document.getElementById('building-owner')!;
        // owner_div.innerHTML = 'Owner: ' + b.owner_name + `(${b.owner_id})`;
        // document.getElementById('building-guests')!.innerHTML = 'Guests: ' + b.guests.join(', ');
        // document.getElementById('rent-building-room')!.onclick = rent_room(b.id);
        // document.getElementById('rent-building-price')!.innerHTML = 'Rent price (for you): ' + b.room_cost.toString();
        // document.getElementById('rent-building-price-true')!.innerHTML = 'Rent price: ' + b.room_cost_true.toString();
        // document.getElementById('repair-building')!.onclick = repair_building(b.id);
        // document.getElementById('building-description')!.innerHTML = b.type;
        // document.getElementById('building-rooms')!.innerHTML = 'Rooms: ' + b.rooms_occupied + '/' + b.rooms;
        // document.getElementById('building-durability')!.innerHTML = 'Durability: ' + b.durability;
        // document.getElementById('change-price-room')!.onclick = change_price(b.id);
        // if (b.type == LandPlotType.LandPlot) {
        //     document.getElementById('build-shack')!.classList.remove('hidden')
        //     document.getElementById('build-house')!.classList.remove('hidden')
        //     document.getElementById('build-inn')!.classList.remove('hidden')
        //     document.getElementById('build-shack')!.onclick = build_shack(b.id);
        //     document.getElementById('build-house')!.onclick = build_house(b.id);
        //     document.getElementById('build-inn')!.onclick = build_inn(b.id);
        // } else {
        //     document.getElementById('build-shack')!.classList.add('hidden')
        //     document.getElementById('build-house')!.classList.add('hidden')
        //     document.getElementById('build-inn')!.classList.add('hidden')
        // }
    };
}
function building_div(b) {
    //building_slot.onclick = display_building_data(b)
    // building_slot.classList.add('width-50')
    // building_slot.classList.add('height-50')
    // div.appendChild(building_slot)
    // let rooms_label = document.createElement('div')
    // rooms_label.innerHTML = b.rooms_occupied + '/' + b.rooms
    // rooms_label.classList.add('width-50')
    // rooms_label.classList.add('align-center')
    // div.appendChild(rooms_label)
    // div.appendChild(building_button(rent_room, b.id, 'rest cost: ' + b.room_cost.toString()))
    // div.appendChild(building_button(repair_building, b.id, 'repair'))
    // if (b.type == LandPlotType.LandPlot) {
    //     div.appendChild(building_button(build_house, b.id, 'build house'))
    //     div.appendChild(building_button(build_inn, b.id, 'build inn'))
    //     div.appendChild(building_button(build_shack, b.id, 'build shack'))
    // }
    //building_slot.classList.add('border-white')
    //return building_slot
}
function building_button(callback, id, inner_html) {
    let button = document.createElement('button');
    button.onclick = callback(id);
    button.innerHTML = inner_html;
    button.classList.add('width-50');
    return button;
}
