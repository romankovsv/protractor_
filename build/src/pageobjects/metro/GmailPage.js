"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
const Element_1 = require("../../wrappers/Element");
class GmailPage {
    constructor() {
        this.emailField = new Element_1.Element(protractor_1.element(protractor_1.By.id("identifierId")));
        this.nextButton = new Element_1.Element(protractor_1.element(protractor_1.By.xpath("(//div[@role='button']//span/span)[1]")));
        this.nextButtonForPassword = new Element_1.Element(protractor_1.element(protractor_1.By.xpath("(//div[@role='button']//span/span)[last()-1]")));
        this.passwordField = new Element_1.Element(protractor_1.element(protractor_1.By.css("input[type='password']")));
        this.doneButton = new Element_1.Element(protractor_1.element(protractor_1.By.xpath("//span[contains(text(), 'Done')]")));
    }
}
exports.GmailPage = GmailPage;
//# sourceMappingURL=GmailPage.js.map