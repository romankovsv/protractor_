import {by, element} from 'protractor';
import {ContactListPageObject} from "./ContactListPageObject";
import {Condition} from "../helpers/Condition";
import {WebElement} from "../wrappers/WebElement";

export class NewContactPageObject {

    condition: Condition;
    inputEmail: WebElement;
    inputName: WebElement;
    inputPhone: WebElement;
    createButton: WebElement;

    constructor() {
        this.condition = new Condition();
        this.inputName = new WebElement(element(by.css('#contact-name')));
        this.inputEmail = new WebElement(element(by.css('#contact-email')));
        this.inputPhone = new WebElement(element(by.css('input[type="tel"]')));
        this.createButton = new WebElement(element(by.css('.create-button')));
    }

    async setContactInfo(name: string, email: string, phoneNumber: string) {

        await this.condition.shouldBeVisible(this.inputName, 10);
        await this.inputName.type(name);
        if (email) {
            await this.inputEmail.type(email);
        }
        if (phoneNumber) {
            await this.inputPhone.type(phoneNumber);
        }
    }

    async clickCreateButton() {
        await this.condition.shouldBeClickable(this.createButton, 10)
        await this.createButton.customClick();
        return new ContactListPageObject();
    }

    async getName() {
        return await this.inputName.getAttribute('value');
    }


    async getPhone() {
        return await this.inputPhone.getAttribute('value');
    }

    async getEmail() {
        return await this.inputEmail.getAttribute('value');
    }
}