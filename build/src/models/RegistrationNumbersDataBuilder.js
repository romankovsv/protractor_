"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationNumbersDataBuilder = void 0;
const RegistrationNumbersData_1 = require("./RegistrationNumbersData");
class RegistrationNumbersDataBuilder {
    constructor(competentCommercialRegistry) {
        this.data = new RegistrationNumbersData_1.RegistrationNumbersData(competentCommercialRegistry);
    }
    setcommercialRegistrationNumber(number) {
        this.data.commercialRegistrationNumber = number;
        return this;
    }
    setcommercialRegisterExcertpt(excertpt) {
        this.data.commercialRegisterExcertpt = excertpt;
        return this;
    }
    setpowerOfAttorney(powerOfAttorney) {
        this.data.powerOfAttorney = powerOfAttorney;
        return this;
    }
    build() {
        return this.data;
    }
}
exports.RegistrationNumbersDataBuilder = RegistrationNumbersDataBuilder;
//# sourceMappingURL=RegistrationNumbersDataBuilder.js.map