import {browser} from "protractor";
import {Properties} from "../../properties/Properties";
import {Condition} from "../../helpers/Condition";
import {Log} from "../../helpers/Log";

export class BasePage {
    protected condition: Condition;

    protected async enableAngularSync(on:boolean){
        await browser.waitForAngularEnabled(on);
    }

    constructor(){
        this.condition = new Condition()
    }
    async navigateTo(url:string) {
        await Log.log().debug("\nNavigate to Url: " + url);
        await browser.waitForAngularEnabled(true);
        await browser.get(url);
        await this.condition.urlShouldContain(url, 15)
    }

    async navigateToWithDisabledAngularWait(url:string){
        await Log.log().debug("\nNavigate to Url: " + url);
        await browser.waitForAngularEnabled(false);
        await browser.sleep(1000)
        await browser.navigate().to(url);
        await this.condition.urlShouldContain(url, 15)
    }
}