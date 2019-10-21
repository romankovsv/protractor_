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
const BasePage_1 = require("../BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const Logger_1 = require("../../helpers/Logger");
const protractor_1 = require("protractor");
const BankFieldsPage_1 = require("./BankFieldsPage");
class AddressFieldsPage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.countryField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[placeholder='Type in country']")));
        this.postalCodeField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='zip']")));
        this.cityField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='city']")));
        this.addressLine1 = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='address'][ng-reflect-name='line1']")));
        this.addressLine2 = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='address'][ng-reflect-name='line2']")));
        this.emailField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='email']")));
        this.phoneField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='phone']")));
        this.nextButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("cdkPortalButton")));
        this.faxField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[name='fax']")));
    }
    fillAddressData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.logs("In Fill address data");
            yield this.countryField.type(data.country);
            yield this.postalCodeField.type(data.postalCode);
            yield this.cityField.type(data.city);
            yield this.addressLine1.type(data.addressLine1);
            yield this.addressLine2.type(data.addressLine2);
            yield this.emailField.type(data.email);
            yield this.phoneField.type(data.phone);
            yield this.faxField.type(data.fax);
            yield this.nextButton.customClick();
            return new BankFieldsPage_1.BankFieldsPage();
        });
    }
}
exports.AddressFieldsPage = AddressFieldsPage;
//# sourceMappingURL=AddressFieldsPage.js.map