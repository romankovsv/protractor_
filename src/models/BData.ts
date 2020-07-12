import {WebElement} from "../wrappers/WebElement";

export class BankData {

    bank:string;
    iban:string;
    bic:string
    accountHolder:string;

    constructor(bank:string){
        this.bank = bank;
    }



}