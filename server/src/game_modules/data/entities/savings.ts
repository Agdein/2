import { money } from "@custom_types/common";
import { SavingsJson } from "@custom_types/common";

export class Savings {
    data: money

    constructor() {
        this.data = 0 as money;
    }

    json():SavingsJson {
        var tmp = {
            data: this.data,
        };
        return tmp;
    }

    transfer_all(target:Savings) {
        this.transfer(target, this.get())
    }

    from_json(x:SavingsJson) {
        this.data = x.data;
    }

    set(x: money) {
        if (this.data == x) return
        this.data = x;
    }

    get() {
        return this.data;
    }

    inc(x:money) {
        var a = this.get();
        if ((a + x) < 0) {
            this.set(0 as money);
        } else {
            this.set(a + x as money)
        }
    }

    transfer(target: Savings, x: money) {
        var a = this.get();
        var b = target.get();
        var tmp = x;
        if ((a - x >= 0) && (b + x >= 0)) {
            this.inc(-x as money);
            target.inc(x);
        } else if ((a - x < 0) && (b + x >= 0)) {
            tmp = a - x as money;
            this.set(0 as money);
            target.inc(x + tmp as money);
        }
        return tmp;
    }
}