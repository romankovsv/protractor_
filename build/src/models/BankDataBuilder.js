"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankDataBuilder = void 0;
const BData_1 = require("./BData");
class BankDataBuilder {
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
exports.BankDataBuilder = BankDataBuilder;
//# sourceMappingURL=BankDataBuilder.js.map