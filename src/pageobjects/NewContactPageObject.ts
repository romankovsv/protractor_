import {by, element} from 'protractor';
import {ContactListPageObject} from "./ContactListPageObject";
import {Condition} from "../helpers/Condition";
import {Element} from "../wrappers/Element";

export class NewContactPageObject {

    condition: Condition;
    inputEmail: Element;
    inputName: Element;
    inputPhone: Element;
    createButton: Element;

    constructor() {
        this.condition = new Condition();
        this.inputName = new Element(element(by.css('#contact-name')));
        this.inputEmail = new Element(element(by.css('#contact-email')));
        this.inputPhone = new Element(element(by.css('input[type="tel"]')));
        this.createButton = new Element(element(by.css('.create-button')));
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