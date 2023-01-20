module.exports = class Cart
{
    constructor(oldCart)
    {
        this.items = oldCart.items || {};
        this.SumQt = oldCart.SumQt || 0;
        this.SumP = oldCart.SumP || 0;
        this.SaleP = oldCart.SaleP || 0;
        this.userId = oldCart.userId || "";
    }

    add(item, id)
    {
        let SaveI = this.items[id];
        if (!SaveI){
            SaveI = this.items[id] = {item: item, qty: 0, price: 0};
        }
        SaveI.qty++;
        SaveI.price = SaveI.item.price * SaveI.qty;
        SaveI.price = parseFloat(SaveI.price.toFixed(2))
        this.SumQt++;
        this.SumP += SaveI.item.price;
        this.SumP = parseFloat(this.SumP.toFixed(2))
    }

    decreaseQty(id) 
    {
        this.items[id].qty--;
        this.items[id].price -= this.items[id].item.price;
        this.items[id].price = parseFloat(this.items[id].price.toFixed(2))
        this.SumQt--;
        this.SumP -= this.items[id].item.price
        this.SumP = parseFloat(this.SumP.toFixed(2))

        if(this.items[id].qty <= 0) {
            delete this.items[id];
        }
    }

    increaseQty(id)
    {
        this.items[id].qty++;
        this.items[id].price += this.items[id].item.price;
        this.items[id].price = parseFloat(this.items[id].price.toFixed(2))
        this.SumQt++;
        this.SumP += this.items[id].item.price
        this.SumP = parseFloat(this.SumP.toFixed(2))
    }

    generateArray() 
    {
        let arr = [];
        for (let id in this.items) {
            arr.push(this.items[id])
        }
        return arr;
    }
}