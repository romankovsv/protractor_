import {browser, protractor} from "protractor";
import matchers = require('jasmine-protractor-matchers')

export abstract class BasePage{
    protected url: string = "https://rozetka.com.ua/";

    static EC = protractor.ExpectedConditions;

    async open(){
        return browser.driver.get(this.url);
    }
}