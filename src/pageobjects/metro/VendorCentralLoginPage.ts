import {browser, by, element, ElementFinder} from 'protractor';
import {NewContactPageObject} from "../NewContactPageObject";
import {Condition} from "../../helpers/Condition";
import {Element} from "../../wrappers/Element";
import {Log} from "../../helpers/Log";
import {Generator} from "../../helpers/Generator";
import {SMSHomePage} from "./SMSHomePage";

export class VendorCentralLoginPage{
    private condition: Condition;
    private emailField: Element ;
    private passwordField: Element ;
    private loginButton: Element ;

    constructor(){
        this.condition = new Condition();
        this.emailField =  new Element(element(by.id('emailInput')));
        this.passwordField =  new Element(element(by.id('passInput')));
        this.loginButton =  new Element(element(by.id('submit_btn')));
    }

    async navigateTo() {
        browser.waitForAngularEnabled(false);
        await browser.get('https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com');
        await this.condition.urlShouldContain('metro-vendorcentral.com', 10)
    }

    async login():Promise<SMSHomePage>{
        await this.emailField.type('admin@sms.com');
        await this.passwordField.type('admin');
        await this.loginButton.customClick();
        return new SMSHomePage();
    }
}