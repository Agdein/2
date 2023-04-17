"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
const data_1 = require("./data");
const events_1 = require("./events/events");
const factions_1 = require("./factions");
const materials_manager_1 = require("./manager_classes/materials_manager");
const system_1 = require("./map/system");
const elo_1 = require("./races/elo");
const graci_1 = require("./races/graci");
const human_1 = require("./races/human");
const rat_1 = require("./races/rat");
var Template;
(function (Template) {
    let Character;
    (function (Character) {
        function Base(template, name, model, x, y, faction_id) {
            const cell = system_1.MapSystem.coordinate_to_id(x, y);
            let character = events_1.Event.new_character(template, name, cell, model);
            if (faction_id != undefined)
                data_1.Data.Reputation.set(faction_id, character.id, "member");
            return character;
        }
        function GenericHuman(x, y, name, faction) {
            let human = Base(human_1.HumanTemplate, name, undefined, x, y, faction);
            human.skills.woodwork += 10;
            human.skills.cooking += 15;
            human.skills.hunt += 5;
            human.skills.fishing += 5;
            human.skills.travelling += 5;
            human.skills.noweapon += 10;
            return human;
        }
        Character.GenericHuman = GenericHuman;
        function HumanSteppe(x, y, name) {
            let human = GenericHuman(x, y, name, factions_1.Factions.Steppes.id);
            human.skills.hunt += 20;
            human.skills.skinning += 10;
            human.skills.cooking += 10;
            human.skills.travelling += 30;
            human.skills.ranged += 20;
            human.skills.noweapon += 10;
            return human;
        }
        Character.HumanSteppe = HumanSteppe;
        function HumanStrong(x, y, name) {
            let human = Base(human_1.HumanStrongTemplate, name, undefined, x, y, undefined);
            return human;
        }
        Character.HumanStrong = HumanStrong;
        function HumanCity(x, y, name) {
            let human = GenericHuman(x, y, name, factions_1.Factions.City.id);
            human.skills.fishing += 20;
            human.skills.noweapon += 5;
            return human;
        }
        Character.HumanCity = HumanCity;
        function GenericRat(x, y, name) {
            let rat = Base(rat_1.RatTemplate, name, undefined, x, y, factions_1.Factions.Rats.id);
            rat.perks.claws = true;
            return rat;
        }
        Character.GenericRat = GenericRat;
        function MageRat(x, y, name) {
            let rat = Base(rat_1.MageRatTemplate, name, undefined, x, y, factions_1.Factions.Rats.id);
            rat.perks.claws = true;
            rat.perks.magic_bolt = true;
            rat.perks.mage_initiation = true;
            rat.stash.inc(materials_manager_1.ZAZ, 5);
            return rat;
        }
        Character.MageRat = MageRat;
        function BerserkRat(x, y, name) {
            let rat = Base(rat_1.BerserkRatTemplate, name, undefined, x, y, factions_1.Factions.Rats.id);
            rat.perks.claws = true;
            rat.perks.charge = true;
            rat.skills.noweapon = 40;
            return rat;
        }
        Character.BerserkRat = BerserkRat;
        function BigRat(x, y, name) {
            let rat = Base(rat_1.BigRatTemplate, name, undefined, x, y, factions_1.Factions.Rats.id);
            rat.perks.claws = true;
            rat.skills.noweapon = 40;
            return rat;
        }
        Character.BigRat = BigRat;
        function MageElo(x, y, name) {
            let elo = Base(elo_1.EloTemplate, name, undefined, x, y, factions_1.Factions.Elodinos.id);
            elo.perks.magic_bolt = true;
            elo.perks.mage_initiation = true;
            elo.skills.magic_mastery = 20;
            elo.skills.cooking = 20;
            elo.stash.inc(materials_manager_1.ZAZ, 30);
            return elo;
        }
        Character.MageElo = MageElo;
        function Elo(x, y, name) {
            let elo = Base(elo_1.EloTemplate, name, undefined, x, y, factions_1.Factions.Elodinos.id);
            return elo;
        }
        Character.Elo = Elo;
        function Graci(x, y, name) {
            let graci = Base(graci_1.GraciTemplate, name, undefined, x, y, factions_1.Factions.Graci.id);
            graci.skills.travelling = 70;
            return graci;
        }
        Character.Graci = Graci;
    })(Character = Template.Character || (Template.Character = {}));
})(Template = exports.Template || (exports.Template = {}));
