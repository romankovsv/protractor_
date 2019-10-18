export class Generator{

    static generateStringWithLenght(lenght:number):string{
        let x = '0123456789qweryuiopasdfghjklzxcvbnm';
        let value = '';
        for (let i = 1; i <=lenght ; i++) {
            let c = Math.floor((Math.random()*x.length)+0)
            value+=x.charAt(c);
        }
        return value;
    }

    static generateEmail():string{
        let x = '0123456789qweryuiopasdfghjklzxcvbnm';
        let value = '';
        for (let i = 1; i <=7 ; i++) {
            let c = Math.floor((Math.random()*x.length)+0)
            value+=x.charAt(c);
        }
        return value+='@gmail.com';
    }
}