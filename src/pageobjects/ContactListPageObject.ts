import {browser, by, element, ElementFinder} from 'protractor';
import {NewContactPageObject} from "./NewContactPageObject";
import {Condition} from "../helpers/Condition";
import {Element} from "../wrappers/Element";
import {Log} from "../helpers/Log";

export class ContactListPageObject {


    condition: Condition;
    plusButton: Element ;

    constructor(){
        this.condition = new Condition();
        this.plusButton =  new Element(element(by.id('add-contact')));
    }

    async clickPlusButton() {
        Log.log().debug("In method click plus button")
        await this.condition.shouldBeClickable(this.plusButton, 10)
        await this.plusButton.customClick();
        return new NewContactPageObject();
    }

    async navigateTo() {
        await browser.get('/#/');
        await this.condition.urlShouldContain('/#/', 10)
    }
}