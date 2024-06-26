import { cell_id } from "@custom_types/ids";
import { Character, NotificationResponse, TriggerResponse } from "../data/entities/character";

export function basic_trigger(character: Character): TriggerResponse {
    if (character.in_battle()) {
        return NotificationResponse.InBattle
    }
    return { response: 'OK' }
}

export function basic_duration(character: Character): number {
    return 1 + character.get_fatigue() / 50;
}

export function basic_duration_modifier(character: Character): number {
    return 1
}

export function dummy_effect(character: Character, cell: cell_id): void {
    return
}

export function dummy_duration(char: Character) {
    return 0.5;
}

export function dummy_start(char: Character) {}
