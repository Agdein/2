import { isHTML, select } from "../HTMLwrappers/common.js";
export function value_bar_class_name(tag) {
    return tag + "_value_bar";
}
export function value_class_name(tag) {
    return tag + "_value";
}
export function value_indicator_class_name(tag) {
    return tag + "_value_indicator";
}
export class Value {
    constructor(socket, id) {
        this._id = id;
        this._value = 0;
        this._update(0);
        ((display) => socket.on(`val_${id}_c`, (data) => {
            console.log("update value " + id);
            display.value = data;
        }))(this);
    }
    _update(difference) {
        for (let item of select("." + value_class_name(this._id))) {
            item.innerHTML = `${this._value}`;
        }
    }
    set value(value) {
        let old_value = this._value;
        this._value = value;
        this._update(value - old_value);
    }
    get value() {
        return this._value;
    }
}
export class LimitedValue extends Value {
    constructor(socket, id) {
        super(socket, id);
        this._max_value = 100;
        ((display) => socket.on(`val_${id}_m`, (data) => {
            display.max_value = data;
        }))(this);
    }
    _update(difference) {
        for (let item of select("." + value_class_name(this._id))) {
            item.innerHTML = `${this._value} / ${this._max_value}`;
        }
    }
    set max_value(value) {
        this._max_value = value;
        this._update(0);
    }
    get max_value() {
        return this._max_value;
    }
}
export class BarValue extends LimitedValue {
    _update(difference) {
        super._update(difference);
        for (let item of select("." + value_bar_class_name(this._id))) {
            if (isHTML(item)) {
                item.style.width = `${Math.floor(this.value / this.max_value * 100)}%`;
            }
        }
    }
}
export class StashValue extends Value {
    constructor(socket, id, material_index) {
        super(socket, id);
        this.material_index = material_index;
        let indicators = select(`.${value_indicator_class_name(this._id)}`);
        for (let item of indicators) {
            ((item) => item.addEventListener("animationend", (event) => {
                item.classList.remove(...["stash_up", "stash_down"]);
            }, false))(item);
        }
    }
    _update(difference) {
        super._update(difference);
        let indicators = select(`.${this._id}_value_indicator`);
        for (let item of indicators) {
            if (difference < 0) {
                item.classList.remove(...['stash_up', 'stash_down']);
                item.classList.add('stash_down');
            }
            else if (difference > 0) {
                item.classList.remove(...['stash_up', 'stash_down']);
                item.classList.add('stash_up');
            }
        }
    }
    get material_string() {
        return this._id;
    }
}
