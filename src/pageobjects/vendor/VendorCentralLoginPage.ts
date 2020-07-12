import {browser, by, element, ElementFinder} from 'protractor';
import {NewContactPageObject} from "../NewContactPageObject";
import {Condition} from "../../helpers/Condition";
import {WebElement} from "../../wrappers/WebElement";
import {Logger} from "../../helpers/Logger";
import {Generator} from "../../helpers/Generator";
import {SMSHomePage} from "./SMSHomePage";
import {WebBrowser} from "../../wrappers/WebBrowser";
import {Properties} from "../../properties/Properties";
import {BasePage} from "./BasePage";

export class VendorCentralLoginPage extends BasePage{
    private emailField: WebElement ;
    private passwordField: WebElement ;
    private loginButton: WebElement ;

    constructor(){
        super()
        this.emailField =  new WebElement(element(by.id('emailInput')));
        this.passwordField =  new WebElement(element(by.id('passInput')));
        this.loginButton =  new WebElement(element(by.id('submit_btn')));
    }



    async login():Promise<SMSHomePage>{
        Logger.log().debug(`Login with email:${Properties.VendorCentralEmail} and password: ${Properties.VendorCentralPassword}`)
        await this.emailField.type(Properties.VendorCentralEmail);
        await this.passwordField.type(Properties.VendorCentralPassword);
        await this.loginButton.customClick();
        return new SMSHomePage();
    }
}