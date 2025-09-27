let openShopping = document.querySelector('.shopping');
let closeShopping = document.querySelector('.closeShopping');
let list = document.querySelector('.list');
let listCard = document.querySelector('.listCard');
let body = document.querySelector('body');
let total = document.querySelector('.total');
let quantity = document.querySelector('.quantity');

openShopping.addEventListener('click', ()=>{
    body.classList.add('active');
});
closeShopping.addEventListener('click', ()=>{
    body.classList.remove('active');
});

let products = [];
let listCards = [];
let appliedCoupon = 0;

// Initialize app and fetch products from backend
function initApp(){
    fetch('http://localhost:3000/products')
        .then(res => res.json())
        .then(data => {
            products = data;
            list.innerHTML = '';
            products.forEach((value) => {
                let newDiv = document.createElement('div');
                newDiv.classList.add('item');
                newDiv.innerHTML = `
                    <img src="image/${value.id}.PNG">
                    <div class="title">${value.name}</div>
                    <div class="price">${value.price.toLocaleString()}</div>
                    <button onclick="addToCard(${value.id})">Add To Cart</button>`;
                list.appendChild(newDiv);
            });
        });
}
initApp();

// Add to cart (calls backend)
function addToCard(productId){
    fetch('http://localhost:3000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        listCards = data.cart.map(item => ({
            ...item.product,
            quantity: item.quantity,
            price: item.product.price * item.quantity
        }));
        reloadCard();
    });
}

// Remove from cart (calls backend)
function changeQuantity(productId, quantityValue){
    if(quantityValue === 0){
        fetch('http://localhost:3000/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        })
        .then(res => res.json())
        .then(data => {
            listCards = data.cart.map(item => ({
                ...item.product,
                quantity: item.quantity,
                price: item.product.price * item.quantity
            }));
            reloadCard();
        });
    } else {
        // Update quantity locally
        fetch('http://localhost:3000/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: quantityValue })
        })
        .then(res => res.json())
        .then(data => {
            listCards = data.cart.map(item => ({
                ...item.product,
                quantity: item.quantity,
                price: item.product.price * item.quantity
            }));
            reloadCard();
        });
    }
}

// Reload cart UI
function reloadCard(){
    listCard.innerHTML = '';
    let count = 0;
    let totalPrice = 0;

    listCards.forEach((value)=>{
        if(value != null){
            totalPrice += value.price;
            count += value.quantity;

            let newDiv = document.createElement('li');
            newDiv.innerHTML = `
                <div><img src="image/${value.id}.PNG"/></div>
                <div>${value.name}</div>
                <div>${value.price.toLocaleString()}</div>
                <div>
                    <button onclick="changeQuantity(${value.id}, ${value.quantity - 1})">-</button>
                    <div class="count">${value.quantity}</div>
                    <button onclick="changeQuantity(${value.id}, ${value.quantity + 1})">+</button>
                </div>`;
            listCard.appendChild(newDiv);
        }
    });

    total.innerText = totalPrice.toLocaleString();
    quantity.innerText = count;

    updateCartSummary();
}

// Coupon
function applyCoupon() {
    let code = document.getElementById("coupon").value.trim();
    if (code === "NEW50") {
        appliedCoupon = 50;
        document.getElementById("coupon-message").innerText = "Coupon applied: ₹50 off";
    } else {
        appliedCoupon = 0;
        document.getElementById("coupon-message").innerText = "Invalid coupon code";
    }
    reloadCard();
}

// Cart summary
function updateCartSummary() {
    let subtotal = 0;
    listCards.forEach((value) => { if(value!=null) subtotal += value.price; });

    let discount = subtotal > 5000 ? subtotal * 0.05 : 0;
    let delivery = subtotal > 1000 ? 0 : 50;
    let couponDiscount = appliedCoupon;
    let totalAfterDiscounts = subtotal - discount + delivery - couponDiscount;
    let gst = totalAfterDiscounts * 0.18;
    let finalTotal = totalAfterDiscounts + gst;

    document.getElementById("subtotal").innerText = subtotal.toLocaleString();
    document.getElementById("discount").innerText = discount.toLocaleString();
    document.getElementById("delivery").innerText = delivery.toLocaleString();
    document.getElementById("coupon-discount").innerText = couponDiscount.toLocaleString();
    document.getElementById("gst").innerText = gst.toLocaleString();
    document.getElementById("final-total").innerText = finalTotal.toLocaleString();
}

// Checkout (calls backend)
function checkout() {
    if(listCards.length === 0) { alert("Cart is empty!"); return; }

    let payment = document.getElementById("payment").value;

    fetch('http://localhost:3000/checkout', {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message + " | Payment: " + payment);
        listCards = [];
        appliedCoupon = 0;
        document.getElementById("coupon-message").innerText = "";
        reloadCard();
    });
}
