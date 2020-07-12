import {browser, ElementFinder, protractor} from "protractor";
import {Logger} from "./Logger";

export class Condition {

    async shouldBeVisible(el: ElementFinder, timeout: number) {
        Logger.logs("Inside should be visable")
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.visibilityOf(el), timeout * 1000,`Element ${el.locator()} is not visible`)
            .catch((error) => {
                Logger.logs(error);
                throw error;
            });
    }

    async shouldBeNotVisible(el: ElementFinder, timeout: number) {
        Logger.logs("Inside should be visable")
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.not(EC.visibilityOf(el)), timeout * 1000,`Element ${el.locator()} is visible, but shouldnt be`)
            .catch((error) => {
                Logger.logs(error);
                throw error;
            });
    }

     async shouldBeClickable(el: ElementFinder, timeout: number) {
        Logger.logs("Inside should be clickable")
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.elementToBeClickable(el), timeout * 1000,`Element ${el.locator()} is not clickable`)
            .catch((error) => {
                Logger.logs(`Element ${el.locator()} is not clickable\n`+ error);
                error.message = `Element ${el.locator()} is not clickable`;
                throw error;
            });
    }

    async urlShouldContain(urlPart:string, timeout: number) {
        Logger.logs("Inside url should contains:" + urlPart)
        let EC = protractor.ExpectedConditions;
        await browser.wait(EC.urlContains(urlPart), timeout * 1000)
            .catch((error) => {
                Logger.logs(error);
                throw error;
            });
    }
}
