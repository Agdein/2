import { cell_id, char_id } from "../types";

export interface CellData {
    id: cell_id
    x: number,
    y: number,
    market_scent: number,
    rat_scent: number,
    rupture: boolean
}
