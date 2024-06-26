var _a;
import { elementById } from "../../HTMLwrappers/common.js";
import { geom2, geom3 } from "../battle_image_helper.js";
import { globals } from "../../globals.js";
function raw_to_battle(pos) {
    return pos;
}
function raw_to_canvas(pos) {
    return pos;
}
function random(l, r) {
    return Math.random() * (r - l) + l;
}
const tilemap = new Image();
tilemap.src = 'static/img/battle_tiles.png';
export class BattleView {
    static x_y_to_tile(x, y) {
        return (x - this.left) * this.max_dim + y;
    }
    static set_tile(x, y, value) {
        const tile = this.x_y_to_tile(x, y);
        this.tiles[tile] = value;
    }
    static get_tile(x, y) {
        const tile = this.x_y_to_tile(x, y);
        return this.tiles[tile];
    }
    static generate_noise_vectors(n) {
        let vectors = [];
        for (let i = 0; i < n; i++) {
            vectors.push([random(this.left * 1.1, this.right * 1.1), random(this.top * 1.1, this.bottom * 1.1), random(-0.5, 0.5)]);
        }
        return vectors;
    }
    static calculate_noise(x, y, noise_vectors) {
        const tile_vector = [x, y, 0];
        let noise = 0;
        for (let vector of noise_vectors) {
            noise += 1 / (5 + geom3.dist(tile_vector, vector));
        }
        return noise;
    }
    static regenerate_tiles() {
        const noise_vectors = this.generate_noise_vectors(10);
        console.log(noise_vectors);
        let max_noise = 0;
        let min_noise = 9999;
        for (let i = this.left; i < this.right; i++) {
            for (let j = this.top; j < this.bottom; j++) {
                const noise = this.calculate_noise(i, j, noise_vectors);
                if (noise > max_noise) {
                    max_noise = noise;
                }
                if (noise < min_noise) {
                    min_noise = noise;
                }
                this.set_tile(i, j, noise);
            }
        }
        for (let i = this.left; i < this.right; i++) {
            for (let j = this.top; j < this.bottom; j++) {
                let noise = this.get_tile(i, j);
                if (noise == undefined)
                    continue;
                this.set_tile(i, j, (noise - min_noise) / (max_noise - min_noise));
            }
        }
    }
    // useful methods:
    static set_callbacks(onmousemove, onmousedown, onmouseup) {
        this.canvas.onmousedown = onmousedown;
        this.canvas.onmousemove = onmousemove;
        this.canvas.onmouseup = onmouseup;
    }
    // coordinate conversions:
    static get_mouse_pos_in_canvas(event) {
        var rect = this.canvas.getBoundingClientRect();
        let tmp = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        return raw_to_canvas(tmp);
    }
    static battle_to_canvas(pos, camera) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        let centre = { x: pos.y, y: pos.x };
        centre.x = -centre.x * this.scale + w / 2 + camera.x;
        centre.y = centre.y * this.scale + h / 2 + camera.y;
        return raw_to_canvas(centre);
    }
    static canvas_to_battle(pos) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        let tmp = { x: pos.x, y: pos.y };
        tmp.x = (tmp.x - w / 2) / (-this.scale);
        tmp.y = (tmp.y - h / 2) / (this.scale);
        return raw_to_battle({ x: tmp.y, y: tmp.x });
    }
    // drawing functions:
    static draw_background() {
        this.canvas_context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // tiles
        for (let i = this.left; i < this.right; i++) {
            for (let j = this.top; j < this.bottom; j++) {
                let start_point = this.battle_to_canvas({ x: i, y: j + 1 }, this.camera);
                const colour = this.get_tile(i, j);
                if (colour == undefined)
                    continue;
                let tile = 0;
                if ((colour > 0.7) || (colour < 0.2)) {
                    tile = 1;
                }
                this.canvas_context.drawImage(tilemap, tile * 50, 0, 50, 50, start_point.x, start_point.y, this.scale, this.scale);
            }
        }
        // display border
        this.canvas_context.strokeStyle = 'rgba(0, 0, 0, 1)';
        this.canvas_context.beginPath();
        this.canvas_context.setLineDash([]);
        const c1 = this.battle_to_canvas(this.corners[0], this.camera);
        this.canvas_context.moveTo(c1.x, c1.y);
        for (let c of this.corners) {
            const next = this.battle_to_canvas(c, this.camera);
            this.canvas_context.lineTo(next.x, next.y);
        }
        this.canvas_context.stroke();
    }
    static get player_position() {
        if (this._player_view == undefined)
            return undefined;
        if (!this._player_view.valid)
            return undefined;
        return this.battle_to_canvas(this._player_view.position, this.camera);
    }
    static get selected_position() {
        if (this._selected_view == undefined)
            return undefined;
        if (!this._selected_view.valid)
            return undefined;
        return this.battle_to_canvas(this._selected_view.position, this.camera);
    }
    static get hovered_position() {
        if (this._hovered_view == undefined)
            return undefined;
        if (!this._hovered_view.valid)
            return undefined;
        return this.battle_to_canvas(this._hovered_view.position, this.camera);
    }
    static get current_turn_position() {
        if (this._current_turn_view == undefined)
            return undefined;
        if (!this._current_turn_view.valid)
            return undefined;
        return this.battle_to_canvas(this._current_turn_view.position, this.camera);
    }
    static get player() {
        return this._player_view;
    }
    static get selected() {
        return this._selected_view;
    }
    static get hovered() {
        return this._hovered_view;
    }
    static get anchor_position() {
        return this._anchor_position;
    }
    static set anchor_position(v) {
        this._anchor_position = v;
    }
    static set player(x) {
        this._player_view = x;
    }
    static set selected(x) {
        this._selected_view = x;
    }
    static set hovered(x) {
        this._hovered_view = x;
    }
    static set current_turn(x) {
        this._current_turn_view = x;
    }
    static draw_anchor() {
        const ctx = this.canvas_context;
        if (this.anchor_position != undefined) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
            ctx.fillStyle = "rgba(10, 10, 200, 0.9)";
            ctx.beginPath();
            ctx.arc(this.anchor_position.x, this.anchor_position.y, this.scale / 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            if (this.player_position != undefined) {
                ctx.beginPath();
                ctx.moveTo(this.player_position.x, this.player_position.y);
                ctx.lineTo(this.anchor_position.x, this.anchor_position.y);
                ctx.stroke();
            }
        }
        if ((this.selected_position != undefined) && (this.player_position != undefined)) {
            ctx.beginPath();
            ctx.moveTo(this.selected_position.x, this.selected_position.y);
            ctx.lineTo(this.player_position.x, this.player_position.y);
            ctx.stroke();
        }
    }
    static draw_selected() {
        if (this.selected_position == undefined)
            return;
        if (this.selected?.hp == 0)
            return;
        const ctx = this.canvas_context;
        const pos = this.selected_position;
        ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        ctx.fillStyle = "rgba(10, 10, 200, 0.4)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.scale * 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    static draw_hovered() {
        if (this.hovered_position == undefined)
            return;
        if (this.hovered?.hp == 0)
            return;
        const ctx = this.canvas_context;
        const pos = this.hovered_position;
        ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        ctx.fillStyle = "rgba(0, 230, 0, 0.4)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.scale * 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    static draw_current_turn() {
        const unit = this._current_turn_view;
        if (unit == undefined)
            return;
        if (!unit.valid)
            this._current_turn_view = undefined;
        if (this.current_turn_position == undefined)
            return;
        if (unit.hp == 0)
            return;
        const ctx = this.canvas_context;
        const pos = this.current_turn_position;
        let wave = Math.sin(globals.now / 1000);
        let radius_end = Math.max(this.scale * unit.ap / unit.move_cost / 2, this.scale * unit.range / 2, 5);
        let radius_start = this.scale / 10;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        //draw small circle at unit's base
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius_end * Math.abs(wave) + radius_start * (1 - Math.abs(wave)), 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }
    static draw_player() {
        const unit = this._player_view;
        if (unit == undefined)
            return;
        if (!unit.valid)
            this._player_view = undefined;
        if (this.player_position == undefined)
            return;
        if (unit.hp == 0)
            return;
        const ctx = this.canvas_context;
        const pos = this.player_position;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        const pi = Math.PI;
        let angle = globals.now * (unit.ap / 5);
        let dx = Math.cos(angle / 1000) * this.scale * unit.range;
        let dy = Math.sin(angle / 1000) * this.scale * unit.range;
        ctx.moveTo(pos.x + dx, pos.y + dy);
        for (let i = 0; i < 20; i++) {
            angle = globals.now * (unit.ap / 5) + 5 * pi * i / 6;
            let dx = Math.cos(angle / 1000) * this.scale * unit.range;
            let dy = Math.sin(angle / 1000) * this.scale * unit.range;
            ctx.lineTo(pos.x + dx, pos.y + dy);
        }
        ctx.stroke();
    }
    static draw_circles(unit) {
        const ctx = this.canvas_context;
        const pos = this.battle_to_canvas(unit.position, this.camera);
        //draw character attack radius circle
        this.canvas_context.strokeStyle = "rgba(0, 0, 0, 1)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.scale * unit.range, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(200, 200, 0, 0.5)"; // yellow otherwise
        ctx.fill();
        // draw movement radius
        ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        ctx.beginPath();
        ctx.setLineDash([20, 20]);
        ctx.arc(pos.x, pos.y, this.scale * unit.ap / unit.move_cost, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        //draw a border of circle above
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.scale * unit.range, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
        //draw small circle at unit's base
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.scale / 10, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }
    static draw(dt, unit, image) {
        if (unit.hp == 0)
            return;
        if ((this.player == undefined) && (globals.character_data?.id == unit.id)) {
            this.player = unit;
        }
        let pos = this.battle_to_canvas(unit.position, this.camera);
        let ctx = this.canvas_context;
        this.draw_circles(unit);
        // choose font
        ctx.font = '15px serif';
        // select style depending on hover/selection status
        if (this._selected_view?.id == unit.id) {
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        }
        else if (this._hovered_view?.id == unit.id) {
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        }
        else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        }
        // draw an actual nameplate
        this.nameplate(unit);
        // draw character's image
        let image_pos = geom2.image_to_canvas(pos, image.w, image.h);
        image.draw(ctx, image_pos, unit.orientation);
        image.update(dt);
        this.hp_bar(unit);
        this.ap_bar(unit);
    }
    static hp_bar(unit) {
        let pos = this.battle_to_canvas(unit.position, this.camera);
        let ctx = this.canvas_context;
        ctx.fillStyle = "green";
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        const width_hp_1 = 0.5;
        const width_max_hp = unit.max_hp * width_hp_1;
        const width_hp = unit.hp * width_hp_1;
        const width_damage = (unit.hp_target - unit.hp) * width_hp_1;
        const height_hp = 10;
        const hp_bar_margin_down = -40;
        const hp_left = pos.x - width_max_hp / 2;
        const hp_top = pos.y - height_hp - hp_bar_margin_down;
        ctx.strokeRect(hp_left, hp_top, width_max_hp, height_hp);
        ctx.fillRect(hp_left, hp_top, width_hp, height_hp);
        ctx.fillStyle = "yellow";
        ctx.fillRect(hp_left + width_hp, hp_top, width_damage, height_hp);
    }
    static ap_bar(unit) {
        let pos = this.battle_to_canvas(unit.position, this.camera);
        let ctx = this.canvas_context;
        ctx.fillStyle = "rgb(0,0,255)";
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        const width_ap_1 = 10;
        const width_max_ap = 10 * width_ap_1;
        const width_ap = unit.ap * width_ap_1;
        const width_change = (unit.ap_target - unit.ap) * width_ap_1;
        const height_ap = 4;
        const ap_bar_margin_down = -30;
        const ap_left = pos.x - width_max_ap / 2;
        const ap_top = pos.y - height_ap - ap_bar_margin_down;
        ctx.fillStyle = "rgb(0, 0, 255)";
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.strokeRect(ap_left, ap_top, width_max_ap, height_ap);
        ctx.fillRect(ap_left, ap_top, width_ap, height_ap);
        if (width_change > 0) { //ap is increasing
            ctx.fillStyle = "yellow";
            ctx.fillRect(ap_left + width_ap, ap_top, width_change, height_ap);
        }
        else { // ap is decreasing --- new ap is already here
            ctx.fillStyle = "yellow";
            ctx.fillRect(ap_left + width_ap + width_change, ap_top, -width_change, height_ap);
        }
    }
    static nameplate(unit) {
        let pos = this.battle_to_canvas(unit.position, this.camera);
        let ctx = this.canvas_context;
        const nameplate_left = pos.x - 50;
        const nameplate_top = pos.y + 50;
        const nameplate_width = 100;
        const nameplate_height = 20;
        // name rect
        ctx.strokeRect(nameplate_left, nameplate_top, nameplate_width, nameplate_height);
        // ap rect
        ctx.strokeRect(nameplate_left, nameplate_top + 20, nameplate_width, nameplate_height);
        //prepare and draw name string
        let string = unit.name;
        if (unit.id == globals.character_data?.id) {
            string = string + '(YOU)';
        }
        ctx.fillText(string + ' || ' + unit.hp + ' hp', nameplate_left + 5, nameplate_top + 15);
        // draw ap string
        ctx.fillText('ap:  ' + Math.floor(unit.ap * 10) / 10, nameplate_left + 5, nameplate_top + 20 + 15);
    }
}
_a = BattleView;
BattleView.canvas = elementById("battle_canvas");
BattleView.canvas_context = _a.canvas.getContext("2d");
BattleView.scale = 28;
BattleView.camera = { x: 0, y: 0 };
// Battle board limits:
BattleView.left = -15;
BattleView.right = 15;
BattleView.top = -15;
BattleView.bottom = 15;
BattleView.width = _a.right - _a.left;
BattleView.height = _a.bottom - _a.top;
BattleView.max_dim = Math.max(_a.width, _a.height);
BattleView.corners = [{ x: _a.left, y: _a.top }, { x: _a.right, y: _a.top }, { x: _a.right, y: _a.bottom }, { x: _a.left, y: _a.bottom }, { x: _a.left, y: _a.top }];
// pretty tiles
BattleView.tiles = [];
