import {by, element, ElementFinder} from 'protractor';
import {ContactListPageObject} from "./ContactListPageObject";
import {Condition} from "../helpers/Condition";

export class NewContactPageObject {
    inputName: ElementFinder;
    inputEmail: ElementFinder;
    inputPhone: ElementFinder;
    createButton:ElementFinder;

    condition: Condition = new Condition();

    constructor() {
        this.inputName = element(by.id('contact-name'));
        this.inputEmail = element(by.id('contact-email'));
        this.inputPhone = element(by.css('input[type="tel"]'));
        this.createButton = element(by.css('.create-button'));
    }

    async setContactInfo(name: string, email: string, phoneNumber: string) {

        await this.condition.shouldBeVisible(this.inputName, 10);
        await this.inputName.sendKeys(name);
        if (email) {
            await this.inputEmail.sendKeys(email);
        }
        if (phoneNumber) {
           await this.inputPhone.sendKeys(phoneNumber);
        }
    }

    async clickCreateButton() {
        await this.condition.shouldBeClickable(this.createButton, 10)
        await this.createButton.click();
        return new ContactListPageObject();
    }

   async getName(){
       return  await this.inputName.getAttribute('value');
    }


async getPhone()
{
    return await this.inputPhone.getAttribute('value');
}
async getEmail()
{
    return await this.inputEmail.getAttribute('value');
}
}