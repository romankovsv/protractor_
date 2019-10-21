import {browser, by, element, ElementFinder} from 'protractor';
import {NewContactPageObject} from "./NewContactPageObject";
import {Condition} from "../helpers/Condition";
import {WebElement} from "../wrappers/WebElement";
import {Logger} from "../helpers/Logger";

export class ContactListPageObject {


    condition: Condition;
    plusButton: WebElement ;

    constructor(){
        this.condition = new Condition();
        this.plusButton =  new WebElement(element(by.id('add-contact')));
    }

    async clickPlusButton() {
        Logger.log().debug("In method click plus button")
        await this.condition.shouldBeClickable(this.plusButton, 10)
        await this.plusButton.customClick();
        return new NewContactPageObject();
    }

    async navigateTo() {
        await browser.get('/#/');
        await this.condition.urlShouldContain('/#/', 10)
    }
}