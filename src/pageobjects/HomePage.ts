import {BasePage} from "./BasePage";
import {$, browser} from "protractor";
import {By as WebdriverBy} from 'selenium-webdriver';

export class HomePage extends BasePage {

    protected searchButton;
    // protected searchField = $("input[name='search']");
    protected searchField = browser.driver.findElement(WebdriverBy.css("input[name='search']"))
        .then((elem)=>{
            return elem;
        })


    protected closeAdvertButton = $("span.exponea-close");


    constructor() {
        super();
       /* this.searchButton = $(".search-form .search-form__submit");
        let isClickable = HomePage.EC.elementToBeClickable(this.searchButton);
        browser.wait(isClickable, 5000);*/
    }

    async search(item: string) {
        await browser.driver.findElement(WebdriverBy.css("input[name='search']")).sendKeys(item);
        await browser.driver.findElement(WebdriverBy.css(".search-form .search-form__submit")).click();

        //await this.searchButton.click();
    }

    async closeAdvert() {
        let isClickableSPan = await HomePage.EC.elementToBeClickable(this.closeAdvertButton);
        await browser.wait(isClickableSPan, 5000);
        await this.closeAdvertButton.click();
    }


}