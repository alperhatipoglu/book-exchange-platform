document.addEventListener("DOMContentLoaded", () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadOrderSummary(user.uid)

            document.getElementById("email").value = user.email || ""

            if (user.displayName) {
                document.getElementById("fullname").value = user.displayName
            }
        } else {
            alert("Please login to proceed with checkout")
            window.location.href = "HTMLPage1.html"
        }
    })

    const paymentMethods = document.querySelectorAll(".payment-method")
    paymentMethods.forEach((method) => {
        method.addEventListener("click", function () {
            paymentMethods.forEach((m) => m.classList.remove("active"))

            this.classList.add("active")
            document.getElementById("credit-card-form").style.display = "none"
            document.getElementById("mastercard-form").style.display = "none"
            document.getElementById("paypal-form").style.display = "none"
            document.getElementById("bank-transfer-form").style.display = "none"

            const methodType = this.getAttribute("data-method")
            if (methodType === "credit-card") {
                document.getElementById("credit-card-form").style.display = "block"
            } else if (methodType === "mastercard") {
                document.getElementById("mastercard-form").style.display = "block"
            } else if (methodType === "paypal") {
                document.getElementById("paypal-form").style.display = "block"
            } else if (methodType === "bank-transfer") {
                document.getElementById("bank-transfer-form").style.display = "block"
            }
        })
    })

    document.getElementById("complete-payment").addEventListener("click", () => {
        processPayment()
    })

    const cardNumberInput = document.getElementById("card-number")
    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", (e) => {
            const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
            let formattedValue = ""

            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += " "
                }
                formattedValue += value[i]
            }

            e.target.value = formattedValue
        })
    }

    const expiryDateInput = document.getElementById("expiry-date")
    if (expiryDateInput) {
        expiryDateInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

            if (value.length > 2) {
                value = value.substring(0, 2) + "/" + value.substring(2, 4)
            }

            e.target.value = value
        })
    }

    const mastercardNumberInput = document.getElementById("mastercard-number")
    if (mastercardNumberInput) {
        mastercardNumberInput.addEventListener("input", (e) => {
            const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
            let formattedValue = ""

            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += " "
                }
                formattedValue += value[i]
            }

            e.target.value = formattedValue
        })
    }

    const mastercardExpiryInput = document.getElementById("mastercard-expiry")
    if (mastercardExpiryInput) {
        mastercardExpiryInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

            if (value.length > 2) {
                value = value.substring(0, 2) + "/" + value.substring(2, 4)
            }

            e.target.value = value
        })
    }
})

function loadOrderSummary(userId) {
    const orderItemsContainer = document.getElementById("order-items")
    const orderTotalElement = document.getElementById("order-total-price")

    orderItemsContainer.innerHTML = ""

    firebase
        .database()
        .ref("carts/" + userId)
        .once("value")
        .then((snapshot) => {
            const cartData = snapshot.val()

            if (!cartData) {
                orderItemsContainer.innerHTML = "<p>Your cart is empty.</p>"
                orderTotalElement.textContent = "$0.00"
                return
            }

            let total = 0

            for (const key in cartData) {
                const item = cartData[key]
                const itemTotal = item.price * item.quantity
                total += itemTotal

                const itemElement = document.createElement("div")
                itemElement.className = "order-item"
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="order-item-details">
                        <div><strong>${item.name}</strong></div>
                        <div>$${item.price.toFixed(2)} x ${item.quantity}</div>
                        <div><strong>$${itemTotal.toFixed(2)}</strong></div>
                    </div>
                `

                orderItemsContainer.appendChild(itemElement)
            }

            orderTotalElement.textContent = "$" + total.toFixed(2)
        })
        .catch((error) => {
            console.error("Error loading cart:", error)
            orderItemsContainer.innerHTML = "<p>Error loading your cart. Please try again.</p>"
        })
}

function processPayment() {
    try {
        console.log("Starting payment process...") 

        const fullname = document.getElementById("fullname").value
        const email = document.getElementById("email").value
        const address = document.getElementById("address").value
        const city = document.getElementById("city").value
        const postal = document.getElementById("postal").value
        const country = document.getElementById("country").value

        if (!fullname || !email || !address || !city || !postal || !country) {
            alert("Please fill in all shipping information fields")
            return
        }

        const selectedMethod = document.querySelector(".payment-method.active")
        if (!selectedMethod) {
            alert("Please select a payment method")
            return
        }

        const methodType = selectedMethod.getAttribute("data-method")

        if (methodType === "credit-card") {
            const cardName = document.getElementById("card-name").value
            const cardNumber = document.getElementById("card-number").value.replace(/\s+/g, "")
            const expiryDate = document.getElementById("expiry-date").value
            const cvv = document.getElementById("cvv").value

            if (!cardName || !cardNumber || !expiryDate || !cvv) {
                alert("Please fill in all card details")
                return
            }

            if (cardNumber.length !== 16) {
                alert("Please enter a valid 16-digit card number")
                return
            }

            if (cvv.length !== 3) {
                alert("Please enter a valid 3-digit CVV")
                return
            }
        } else if (methodType === "mastercard") {
            const cardName = document.getElementById("mastercard-name").value
            const cardNumber = document.getElementById("mastercard-number").value.replace(/\s+/g, "")
            const expiryDate = document.getElementById("mastercard-expiry").value
            const cvv = document.getElementById("mastercard-cvv").value

            if (!cardName || !cardNumber || !expiryDate || !cvv) {
                alert("Please fill in all Mastercard details")
                return
            }

            if (cardNumber.length !== 16) {
                alert("Please enter a valid 16-digit Mastercard number")
                return
            }

            if (cvv.length !== 3) {
                alert("Please enter a valid 3-digit CVV")
                return
            }
        }

        const user = firebase.auth().currentUser
        if (!user) {
            alert("Please login to complete your purchase")
            return
        }

        console.log("User authenticated, preparing order data...") 

        const orderId = "ORDER_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11)

        const orderData = {
            orderId: orderId,
            userId: user.uid,
            userEmail: user.email,
            shippingInfo: {
                fullname,
                email,
                address,
                city,
                postal,
                country,
            },
            paymentMethod: methodType,
            orderDate: new Date().toISOString(),
            orderDateFormatted: new Date().toLocaleDateString(),
            status: "paid",
            timestamp: firebase.database.ServerValue.TIMESTAMP,
        }

        console.log("Getting cart items...") 

        firebase
            .database()
            .ref("carts/" + user.uid)
            .once("value")
            .then((snapshot) => {
                console.log("Cart data retrieved") 
                const cartData = snapshot.val()

                if (!cartData) {
                    alert("Your cart is empty")
                    return Promise.reject(new Error("Cart is empty"))
                }

                orderData.items = cartData

                let total = 0
                for (const key in cartData) {
                    const item = cartData[key]
                    total += item.price * item.quantity
                }
                orderData.total = total

                console.log("Saving order to Firebase...") 
                console.log("Order data:", orderData) 

                return firebase.database().ref("orders").push(orderData)
            })
            .then((orderRef) => {
                console.log("Order saved successfully with ID:", orderRef.key) 

                localStorage.setItem("orderTotal", "$" + orderData.total.toFixed(2))
                localStorage.setItem("paymentMethod", methodType)
                localStorage.setItem("orderId", orderData.orderId)

                console.log("Clearing cart...") 

                return firebase
                    .database()
                    .ref("carts/" + user.uid)
                    .remove()
            })
            .then(() => {
                console.log("Cart cleared successfully") 

                alert("Payment successful! Your order has been placed.")

                window.location.href = "order-confirmation.html"
            })
            .catch((error) => {
                console.error("Error in payment process:", error)

                if (error.message === "Cart is empty") {
                    alert("Your cart is empty. Please add items before checkout.")
                } else if (error.code === "PERMISSION_DENIED") {
                    alert("Database permission denied. Please check Firebase rules.")
                } else {
                    alert("Error processing payment: " + error.message + ". Please try again.")
                }
            })
    } catch (error) {
        console.error("Unexpected error in processPayment:", error)
        alert("An unexpected error occurred. Please try again.")
    }
}
