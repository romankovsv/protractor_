"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BDataBuilder = void 0;
const BData_1 = require("./BData");
class BDataBuilder {
    constructor(data) {
        this.data = new BData_1.BData(data);
    }
    setIban(iban) {
        this.data.iban = iban;
        return this;
    }
    setBic(bic) {
        this.data.bic = bic;
        return this;
    }
    setAccountHolder(holder) {
        this.data.accountHolder = holder;
        return this;
    }
    build() {
        return this.data;
    }
}
exports.BDataBuilder = BDataBuilder;
//# sourceMappingURL=BDataBuilder.js.map