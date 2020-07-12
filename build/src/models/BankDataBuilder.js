"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankDataBuilder = void 0;
const BankData_1 = require("./BankData");
class BankDataBuilder {
    constructor(data) {
        this.data = new BankData_1.BankData(data);
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