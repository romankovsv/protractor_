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
const VendorPortalHomePage_1 = require("./VendorPortalHomePage");
class BankFieldsPage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.submitButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("cdkPortalButton")));
        this.bankField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("bankInstitute")));
        this.ibanField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("iban")));
        this.bicField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("bic")));
        this.accountHolderField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("accountHolder")));
    }
    populateBankFields(data) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.logs("In populateBankFields with data: " + data.toString());
            yield this.bankField.type(data.bank);
            yield this.ibanField.type(data.iban);
            yield this.bicField.type(data.bic);
            yield this.accountHolderField.type(data.accountHolder);
            yield this.submitButton.customClick();
            return new VendorPortalHomePage_1.VendorPortalHomePage();
        });
    }
}
exports.BankFieldsPage = BankFieldsPage;
//# sourceMappingURL=BankFieldsPage.js.map