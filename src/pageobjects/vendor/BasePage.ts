import {Properties} from "../../properties/Properties";
import {Condition} from "../../helpers/Condition";
import {element,By, browser} from "protractor";
import {Logger} from "../../helpers/Logger";

export class BasePage {
    protected condition: Condition;

    protected async enableAngularSync(on:boolean){
        await browser.waitForAngularEnabled(on);
    }

    constructor(){
        this.condition = new Condition()
    }
    async navigateTo(url:string) {
        await Logger.logs("\nNavigate to Url: " + url);
        await browser.waitForAngularEnabled(true);
        await browser.get(url);
    }

    async navigateToWithDisabledAngularWait(url:string){
        await Logger.logs("\nNavigate to Url: " + url);
        await browser.waitForAngularEnabled(false);
        await browser.sleep(1000)
        await browser.get(url);
    }

    async stopWatch(){
        await browser.sleep(2000)
    }
}
