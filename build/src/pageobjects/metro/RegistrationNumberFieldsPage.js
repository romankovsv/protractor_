"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const BasePage_1 = require("./BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const Logger_1 = require("../../helpers/Logger");
const AddressFieldsPage_1 = require("./AddressFieldsPage");
class RegistrationNumberFieldsPage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.competentCommercialRegistryField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("competentRegistry")));
        this.commercialRegistrationNumberField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("commercialRegistrationNumber")));
        this.commercialRegisterExcertpt = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[id='registerExcerpt']+*+input[type='file']")));
        this.powerOfAttorney = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[id='powerOfAttorney']+*+input[type='file']")));
        this.nextButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("cdkPortalButton")));
    }
    fillRegistrationNumbers(data) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.logs("In fillRegistrationNumbers");
            yield this.competentCommercialRegistryField.type(data.competentCommercialRegistry);
            yield this.commercialRegistrationNumberField.type(data.commercialRegistrationNumber);
            yield this.commercialRegisterExcertpt.type(data.commercialRegisterExcertpt);
            yield this.powerOfAttorney.type(data.powerOfAttorney);
            yield this.nextButton.customClick();
            return new AddressFieldsPage_1.AddressFieldsPage();
        });
    }
}
exports.RegistrationNumberFieldsPage = RegistrationNumberFieldsPage;
//# sourceMappingURL=RegistrationNumberFieldsPage.js.map