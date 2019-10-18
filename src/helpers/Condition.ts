import {browser, ElementFinder, protractor} from "protractor";
import {Log} from "./Log";

export class Condition {

    async shouldBeVisible(el: ElementFinder, timeout: number) {
        Log.log().info("Inside should be visable")
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.visibilityOf(el), timeout * 1000,`Element ${el.locator()} is not visible`)
            .catch((error) => {
                Log.log().error(error);
            });
    }

     async shouldBeClickable(el: ElementFinder, timeout: number) {
        Log.log().info("Inside should be clickable")
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.elementToBeClickable(el), timeout * 1000,`Element ${el.locator()} is not clickable`)
            .catch((error) => {
                Log.log().error(error);
            });
    }

    async urlShouldContain(urlPart:string, timeout: number) {
        Log.log().info("Inside url should contains:" + urlPart)
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.urlContains(urlPart), timeout * 1000)
            .catch((error) => {
                Log.log().error(error);
            });
    }
}