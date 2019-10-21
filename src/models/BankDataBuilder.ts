import {BankData} from "./BankData";

export class BankDataBuilder {
    
    data:BankData;

    constructor(data:string){
        this.data.bank = data
    }

    public setIban(iban:string){
        this.data.iban = iban;
        return this;
    }

    public setBic(bic:string){
        this.data.bic = bic;
        return this;
    }

    public setAccountHolder(holder:string){
        this.data.accountHolder = holder;
        return this;
    }

    public build():BankData{
        return this.data;
    }
}