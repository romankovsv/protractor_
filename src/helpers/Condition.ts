import {browser, ElementFinder, protractor} from "protractor";

export class Condition {

    async shouldBeVisible(el: ElementFinder, timeout: number) {
        var EC = protractor.ExpectedConditions;
        await browser.wait(EC.visibilityOf(el), timeout * 1000)
            .catch((error) => {
                console.log(error);
            });
    }

     async shouldBeClickable(el: ElementFinder, timeout: number) {
        var EC = protractor.ExpectedConditions;
        await browser.wait(EC.elementToBeClickable(el), timeout * 1000)
            .catch((error) => {
                console.log(error);
            });
    }

    async urlShouldContain(urlPart:string, timeout: number) {
        var EC = protractor.ExpectedConditions;
        await browser.wait(EC.urlContains(urlPart), timeout * 1000)
            .catch((error) => {
                console.log(error);
            });
    }
}