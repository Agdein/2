import { MATERIAL, MaterialStorage, material_string_id } from "@content/content.js";
import { Socket } from "../../../shared/battle_data.js";
import { elementById, isHTML, select, selectHTMLs } from "../HTMLwrappers/common.js";
import { material_icon_url } from "../Stash/stash.js";
import { AnimatedValueInterface, BulkAmountInterface, DependencyUI, LimitedValueInterface, ValueInterface } from "../Types/character.js";
import { smoothstep } from "../common.js";
import { globals } from "../globals.js";

export function value_bar_class_name (id: string) : string {
    return id + "_value_bar";
}

export function value_class_name (id: string) : string {
    return id + "_value";
}

export function material_icon_class_name(id: string): string {
    return id + "_icon"
}

export function value_indicator_class_name (id: string) : string {
    return id + "_value_indicator"
}



export const animated_values_storage : AnimatedValueInterface[] = []

export class Value implements ValueInterface {
    protected _id: string;
    protected _value: number;

    constructor(socket: Socket, id: string, dependents: DependencyUI[]){
        this._id = id;
        this._value = 0;
        this._update(1);

        // console.log("register value: " + id);

        ((display: Value) => socket.on(`val_${id}_c`, (data: number) => {
            // console.log("update value: " + id)
            // console.log("new value: ", data)
            display.value = data

            for (let item of dependents) {
                item.update_display()
            }
        }))(this);
    }

    protected _update(difference: number) {
        if (difference == 0) return;

        for (let item of select("." + value_class_name(this._id))) {
            item.innerHTML = `${this._value}`
        }
    }

    set value(value: number) {
        let old_value = this._value
        this._value = value;
        this._update(value - old_value)
    }

    get value(): number {
        return this._value
    }

    get id(): string {
        return this._id
    }
}

export class AnimatedValue extends Value implements AnimatedValueInterface {
    private last_update_time: number;
    private current_lerp_origin: number;

    constructor(socket: Socket, id: string, dependents: DependencyUI[]) {
        super(socket, id, dependents)

        this.last_update_time = globals.now
        this.current_lerp_origin = 0

        animated_values_storage.push(this)
    }

    protected _update(difference: number) {
        if (difference == 0) return;

        for (let item of select("." + value_class_name(this._id))) {
            item.innerHTML = `${Math.round(this.display_value)}`
        }
    }

    get display_value() {
        const now = globals.now
        const time_passed = Math.min((now - this.last_update_time) / 1000 * 2, 1)
        return smoothstep(this.current_lerp_origin, this._value, time_passed)
    }

    set value(value: number) {
        this.current_lerp_origin = this.display_value;
        this.last_update_time = globals.now;

        this._value = value;
        this._update(value - this.display_value)
    }

    get value() {
        return this._value
    }

    update_display() {
        this._update(1)
    }
}


export class LimitedValue extends Value implements LimitedValueInterface {
    protected _max_value: number;

    constructor(socket: Socket, id: string, dependents: DependencyUI[]) {
        super(socket, id, dependents);

        this._max_value = 100;
        ((display: LimitedValue) => socket.on(`val_${id}_m`, (data: number) => {
            display.max_value = data
        }))(this);
    }

    protected _update(difference: number) {
        for (let item of select("." + value_class_name(this._id))) {
            item.innerHTML = `${this._value} / ${this._max_value}`
        }
    }

    set max_value(value: number) {
        this._max_value = value;
        this._update(0);
    }

    get max_value(): number {
        return this._max_value;
    }
}

export class BarValue extends LimitedValue {
    protected _update(difference: number) {
        super._update(difference);

        for (let item of select("." + value_bar_class_name(this._id))) {
            if (isHTML(item)) {
                item.style.width = `${Math.floor(this.value / this.max_value * 100)}%`
            }
        }
    }
}

export class BulkAmount extends Value implements BulkAmountInterface {
    readonly material_index: MATERIAL
    constructor(socket : Socket, id: string, material_index: MATERIAL, dependents: DependencyUI[]) {
        super(socket, id, dependents)
        this.material_index = material_index
    }

    protected _update(difference: number): void {
        super._update(difference);

        for (let item of selectHTMLs("." + material_icon_class_name(this._id))) {
            item.style.backgroundImage = material_icon_url(MaterialStorage.get(this.material_index).id_string)
        }
    }

    get material_string() {
        return this._id
    }
}

export class StashValue extends BulkAmount {
    constructor(socket : Socket, id: material_string_id, material_index: MATERIAL, dependents: DependencyUI[]) {
        super(socket, id, material_index, dependents)

        let indicators = select(`.${value_indicator_class_name(this._id)}`);
        for (let item of indicators) {
            ((item) => item.addEventListener("animationend", (event) => {
                item.classList.remove(... ["stash_up", "stash_down"])
            }, false))(item)
        }
    }

    protected _update(difference: number): void {
        super._update(difference)
        if (difference == 0) return

        let indicators = select(`.${this._id}_value_indicator`);

        for (let item of indicators) {
            if (difference < 0) {
                item.classList.remove(... ['stash_up', 'stash_down'])
                item.classList.add('stash_down')
            } else if (difference > 0) {
                item.classList.remove(... ['stash_up', 'stash_down'])
                item.classList.add('stash_up')
            }
        }
    }
}