"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyBuilder = void 0;
const Company_1 = require("./Company");
class CompanyBuilder {
    constructor(companyName) {
        this.company = new Company_1.Company(companyName);
    }
    setCompanyLegal(legal) {
        this.company.companyLegal = legal;
        return this;
    }
    setCompanyEmailForOrder(email) {
        this.company.emailForOrder = email;
        return this;
    }
    setTaxNumber(taxNumber) {
        this.company.taxNumber = taxNumber;
        return this;
    }
    setGln(gln) {
        this.company.gln = gln;
        return this;
    }
    setVatNumber(vatNumber) {
        this.company.vatNumber = vatNumber;
        return this;
    }
    setEmail(email) {
        this.company.email = email;
        return this;
    }
    build() {
        return this.company;
    }
}
exports.CompanyBuilder = CompanyBuilder;
//# sourceMappingURL=CompanyBuilder.js.map