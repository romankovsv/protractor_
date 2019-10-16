import {browser, by, element, ElementFinder} from 'protractor';
import {NewContactPageObject} from "./NewContactPageObject";
import {Condition} from "../helpers/Condition";

export class ContactListPageObject {
    plusButton: ElementFinder;
    condition: Condition = new Condition();

    constructor() {
        this.plusButton = element(by.id('add-contact'));
    }

    async clickPlusButton() {
        await this.condition.shouldBeClickable(this.plusButton, 10)
        await this.plusButton.click();
        return new NewContactPageObject();
    }

    async navigateTo() {
        await browser.get('/#/');
        await this.condition.urlShouldContain('/#/', 10)
    }
}