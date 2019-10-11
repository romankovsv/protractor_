import {BaseFragment} from "./BaseFragment";
import {$, browser,$$, ElementFinder} from "protractor";

export class ProductFragmentPage extends BaseFragment {

    protected actualPrice;
    protected productTitles ;


    async getPriceForItem(name: string) {
        this.productTitles = await $$("div[data-location='ProducerPage'] div[class*='title'] a");

       await console.log(this.productTitles.map((elements)=>{
           for (var i = 0;  elements.length; i++) {
               console.log((<ElementFinder>elements[i]).getText());

           }
        }));

       /* let visibilityOf = await ProductFragmentPage.EC.visibilityOf(this.productTitles);
        await browser.wait(visibilityOf, 5000, "Products should be visible")


        console.log(await this.productTitles.getText());*/

       /* this.actualPrice = await $("div[data-location='ProducerPage'] div[name='price'] span[id$='price']");
        let isVisible = ProductFragmentPage.EC.visibilityOf(this.actualPrice);
        await browser.wait(isVisible, 5000, "Price should be visible")

        console.log(this.actualPrice.getText());*/
    }
}