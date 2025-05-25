document.addEventListener("DOMContentLoaded", () => {
    // Firebase auth ve db bağlantısı
    const auth = firebase.auth();
    const db = firebase.database();

    // Elementleri seç
    const welcomeTitle = document.getElementById("welcome-title");
    const profileInfo = document.getElementById("profile-info");
    const notLoggedInMessage = document.getElementById("not-logged-in-message");
    const usernameInput = document.getElementById("username-input");
    const saveNameBtn = document.getElementById("save-name-btn");
    const nameUpdateMsg = document.getElementById("name-update-msg");

    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");

    const loginModal = document.getElementById("login-modal");
    const openLogin = document.getElementById("login-btn");
    const closeLogin = document.getElementById("close-login");
    const registerBtn = document.getElementById("register-btn");
    const loginBtnModal = document.getElementById("login-btn-modal");

    // Modal aç/kapa - sadece 1 kere yaz
    if (openLogin && loginModal && closeLogin) {
        openLogin.onclick = () => loginModal.style.display = "block";
        closeLogin.onclick = () => loginModal.style.display = "none";
    }

    // Kayıt ol
    if (registerBtn) {
        registerBtn.onclick = () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => alert("Registered successfully"))
                .catch(e => alert(e.message));
        };
    }

    // Giriş yap
    if (loginBtnModal) {
        loginBtnModal.onclick = () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Login successful");
                    if (loginModal) loginModal.style.display = "none";
                })
                .catch(e => alert(e.message));
        };
    }

    // Çıkış yap
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            auth.signOut()
                .then(() => alert("Logged out"))
                .catch(e => alert(e.message));
        };
    }

    // Kullanıcı değişimini dinle
    auth.onAuthStateChanged(user => {
        if (user) {
            // Giriş yapmış kullanıcı için UI güncelle
            logoutBtn.style.display = "inline";
            loginBtn.style.display = "none";
            welcomeTitle.style.display = "block";
            profileInfo.style.display = "block";
            notLoggedInMessage.style.display = "none";

            document.getElementById("user-email").textContent = user.email || "";
            document.getElementById("user-name").textContent = user.displayName || "Not set";

            usernameInput.value = user.displayName || "";

            document.getElementById("user-registration-date").textContent =
                new Date(user.metadata.creationTime).toLocaleDateString();

            // Sepet sayısı çek
            const cartRef = db.ref("carts/" + user.uid);
            cartRef.once("value").then(snapshot => {
                let count = 0;
                snapshot.forEach(child => {
                    const item = child.val();
                    count += item.quantity || 1;
                });
                document.getElementById("cart-count").textContent = count;
            });

            // İsim güncelle
            saveNameBtn.onclick = () => {
                const newName = usernameInput.value.trim();
                if (!newName) {
                    alert("Name cannot be empty.");
                    return;
                }
                user.updateProfile({ displayName: newName })
                    .then(() => {
                        document.getElementById("user-name").textContent = newName;
                        nameUpdateMsg.textContent = "Name updated successfully!";
                        nameUpdateMsg.style.color = "green";
                    })
                    .catch(error => {
                        nameUpdateMsg.textContent = "Error updating name: " + error.message;
                        nameUpdateMsg.style.color = "red";
                    });
            };

        } else {
            // Kullanıcı çıkış yaptıysa UI güncelle
            logoutBtn.style.display = "none";
            loginBtn.style.display = "inline";
            welcomeTitle.style.display = "none";
            profileInfo.style.display = "none";
            notLoggedInMessage.style.display = "block";

            document.getElementById("user-email").textContent = "";
            document.getElementById("user-name").textContent = "";
            usernameInput.value = "";
            document.getElementById("user-registration-date").textContent = "";
            document.getElementById("cart-count").textContent = "0";
            nameUpdateMsg.textContent = "";
        }
    });

    // Sayfa yüklendiğinde kitapları yükle
    if (!window.location.pathname.includes("bookdetail.html") && !window.location.pathname.includes("Cart.html")) {
        loadBooks();
    } else if (window.location.pathname.includes("bookdetail.html")) {
        loadBookDetail();
    }
});



function loadBooks() {
    const list = document.getElementById("book-list");
    if (!list) return;

    db.ref("books").once("value").then(snapshot => {
        list.innerHTML = "";

        snapshot.forEach(child => {
            const book = child.val();
            if (book.featured) {  // sadece featured olanları göster
                const div = document.createElement("div");
                div.classList.add("book-card");
                div.innerHTML = `
                    <a href="bookdetail.html?id=${child.key}">
                      <img src="${book.image}" alt="${book.title}" width="150">
                    </a>
                `;
                list.appendChild(div);
            }
        });
    });
}


function getBookIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function loadBookDetail() {
    const bookId = getBookIdFromURL();
    if (!bookId) return;

    db.ref("books/" + bookId).once("value").then(snapshot => {
        const book = snapshot.val();
        if (!book) {
            document.getElementById("book-detail").innerHTML = "<p>Book not found.</p>";
            return;
        }

        const bookDetailHTML = `
        <div style="display: flex; gap: 20px; padding: 40px; max-width: 1000px; margin: auto;">
            <div style="flex: 1;">
                <img src="${book.image}" alt="${book.title}" style="width:100%; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            </div>
            <div style="flex: 2; font-family: sans-serif;">
                <h1 style="margin-bottom: 10px;">${book.title}</h1>
                <h3 style="color: #666;">by ${book.author}</h3>
                <p style="margin: 20px 0;">${book.description}</p>
                <p><strong>Category:</strong> ${book.category}</p>
                <p><strong>Pages:</strong> ${book.pages}</p>
                <p><strong>Publication Date:</strong> ${book.publicationDate}</p>
                <p>
  <span style="
      display: inline-block;
      background: linear-gradient(135deg, #2c5530, #1a3d1f);
      padding: 12px 25px;
      font-size: 22px;
      font-weight: bold;
      color: white;
      border: none;
      border-radius: 15px;
      margin-left: 10px;
      box-shadow: 0 4px 15px rgba(44, 85, 48, 0.3);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;">
    $${book.price.toFixed(2)}
  </span>
</p>


                <div style="margin-top: 20px; display: flex; gap: 15px;">
                    <button onclick="addToCart('${bookId}', '${book.title}', ${book.price}, '${book.image}')" style="
                        padding: 10px 20px; 
                        background: linear-gradient(135deg, darkslategrey, #1a3636);
                        color: white; 
                        border: none; 
                        border-radius: 20px; 
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        transition: all 0.3s ease;
                        min-width: 140px;
                        height: 42px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;">
                        Add to Cart
                    </button>
                    <button onclick="exchangeRequest()" style="
                        padding: 10px 20px; 
                        background: linear-gradient(135deg, darkslategrey, #1a3636);
                        color: white; 
                        border: none; 
                        border-radius: 20px; 
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        transition: all 0.3s ease;
                        min-width: 140px;
                        height: 42px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;">
                        Exchange Request
                    </button>
                </div>


                <!-- Rating Bölümü -->
<div id="rating-section" style="margin-top: 20px;">
  <h4>Rating:</h4>
  <div id="star-rating" style="font-size: 24px; color: #ccc; cursor: pointer;">
    <span data-value="1">&#9733;</span>
    <span data-value="2">&#9733;</span>
    <span data-value="3">&#9733;</span>
    <span data-value="4">&#9733;</span>
    <span data-value="5">&#9733;</span>
  </div>
  <p id="rating-msg" style="color: green; margin-top: 10px;"></p>
</div>









                <!-- Yorum Bölümü -->
                <div id="comments-section" style="margin-top: 30px;">
                    <div id="comments-list" style="border-top: 1px solid #ddd; padding-top: 15px; max-height: 250px; overflow-y: auto;"></div>
                    <textarea id="comment-input" placeholder="Add a comment..." rows="4" style="width: 100%; height: 30px; resize: none;"></textarea><br>
                    <button id="submit-comment-btn" disabled style="
                        margin-top: 10px; 
                        padding: 8px 16px; 
                        background: linear-gradient(135deg, darkslategrey, #1a3636);
                        color: white; 
                        border: none; 
                        border-radius: 20px; 
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        transition: all 0.3s ease;
                        width: 130px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;">
                        Comment
                    </button>
                    <p id="comment-msg" style="color: red; margin-top: 10px;"></p>
                </div>
            </div>
        </div>
        `;

        document.getElementById("book-detail").innerHTML = bookDetailHTML;

        // Yorum fonksiyonlarını başlat
        initComments(bookId);

        initRating(bookId);

    });

}

// Sepete ekleme fonksiyonu
function addToCart(bookId, bookName, price, imageUrl) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please login first to add items to your cart.");
        return;
    }

    const cartRef = db.ref('carts/' + user.uid);

    cartRef.orderByChild('bookId').equalTo(bookId).once('value', snapshot => {
        if (snapshot.exists()) {
            const updates = {};
            snapshot.forEach(child => {
                const key = child.key;
                const item = child.val();
                const newQuantity = (item.quantity || 1) + 1;
                updates[key + '/quantity'] = newQuantity;
            });
            cartRef.update(updates)
                .then(() => alert(bookName + " quantity updated in your cart."))
                .catch(e => alert("Error updating cart: " + e.message));
        } else {
            const newItem = {
                bookId: bookId,
                name: bookName,
                price: price,
                image: imageUrl,
                quantity: 1
            };
            cartRef.push(newItem)
                .then(() => alert(bookName + " has been added to your cart."))
                .catch(error => {
                    console.error("Add to cart failed:", error);
                    alert("Could not add the item to cart. Try again.");
                });
        }
    });
}

function loadCart() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please login to view your cart.");
        document.getElementById("cart-container").innerHTML = "<p>Please login to view your cart.</p>";
        return;
    }
    const userId = user.uid;
    firebase.database().ref("carts/" + userId).once("value")
        .then(snapshot => {
            const cartData = snapshot.val();
            if (!cartData) {
                document.getElementById("cart-container").innerHTML = "<p>Your cart is empty.</p>";
                document.getElementById("cart-items").innerHTML = '';
                document.getElementById("total-price").textContent = "0.00";
                return;
            }
            renderCart(cartData);
        });
}


function renderCart(cart) {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    let total = 0;

    for (const key in cart) {
        const item = cart[key];
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width:70px; vertical-align: middle; margin-right:10px;">
            <strong>${item.name}</strong> — $${item.price.toFixed(2)} x ${item.quantity}
            <button data-key="${key}" class="remove-btn" style="margin-left: 10px; cursor: pointer;">Delete</button>
        `;
        cartItemsContainer.appendChild(li);
        total += item.price * item.quantity;
    }

    const totalPriceElem = document.getElementById('total-price');
    if (totalPriceElem) totalPriceElem.textContent = total.toFixed(2);

    // Silme butonlarına tıklama olayını ata
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-key');
            removeFromCart(key);
        };
    });
}

function removeFromCart(itemKey) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please login!");
        return;
    }

    const cartItemRef = firebase.database().ref('carts/' + user.uid + '/' + itemKey);

    cartItemRef.once('value').then(snapshot => {
        const item = snapshot.val();
        if (!item) {
            alert("The book was not found..");
            return;
        }

        if (item.quantity > 1) {
            // Quantity 1 azalt
            cartItemRef.update({ quantity: item.quantity - 1 })
                .then(() => {
                    alert("Product quantity decreased by 1.");
                    loadCart();
                })
                .catch(err => alert("Update error: " + err.message));
        } else {
            // Quantity 1 ise ürün tamamen sil
            cartItemRef.remove()
                .then(() => {
                    alert("The book was removed from the cart.");
                    loadCart();
                })
                .catch(err => alert("Delete error: " + err.message));
        }
    }).catch(err => alert("Error: " + err.message));
}


function checkout() {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login first!");
        return;
    }
    if (confirm("Are you sure you want to complete the payment?")) {
        const cartRef = db.ref('carts/' + user.uid);
        cartRef.remove()
            .then(() => {
                alert("Your payment was successful! Your cart has been cleared.");
                renderCart({});
            });
    }
}

window.onload = () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            loadCart();
        } else {
            renderCart({});
        }
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.onclick = checkout;
};
document.getElementById("search-input").addEventListener("input", () => {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const bookList = document.getElementById("book-list");

    db.ref("books").once("value").then(snapshot => {
        bookList.innerHTML = "";

        snapshot.forEach(child => {
            const book = child.val();
            if (book.title.toLowerCase().includes(searchTerm)) {
                const div = document.createElement("div");
                div.classList.add("book-card");
                div.innerHTML = `
                    <a href="bookdetail.html?id=${child.key}">
                      <img src="${book.image}" alt="${book.title}" width="150">
                    </a>
                `;
                bookList.appendChild(div);
            }
        });

        if (searchTerm.trim() === "") {
            loadBooks();
        }
    });
});
function exchangeRequest() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please login to send an exchange request.");
        return;
    }

    const bookId = getBookIdFromURL();
    if (!bookId) {
        alert("Book ID not found.");
        return;
    }

    // Path: exchangeRequests/{userId}/{bookId}
    const requestRef = firebase.database().ref(`exchangeRequests/${user.uid}/${bookId}`);

    // Önce kontrol et
    requestRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
            alert("You have already sent an exchange request for this book.");
            return;
        } else {
            // Kitap bilgisi al
            firebase.database().ref("books/" + bookId).once("value").then(bookSnap => {
                const book = bookSnap.val();
                if (!book) {
                    alert("Book not found.");
                    return;
                }

                const request = {
                    userId: user.uid,
                    email: user.email,
                    bookId: bookId,
                    bookTitle: book.title,
                    timestamp: new Date().toISOString()
                };

                // Yaz
                requestRef.set(request)
                    .then(() => {
                        alert("Your exchange request has been sent to the administrator.");
                    })
                    .catch(error => {
                        console.error("Exchange request failed:", error);
                        alert("Could not send the request. Please try again.");
                    });
            });
        }
    });
}
function initComments(bookId) {
    const commentInput = document.getElementById('comment-input');
    const submitCommentBtn = document.getElementById('submit-comment-btn');
    const commentsList = document.getElementById('comments-list');
    const commentMsg = document.getElementById('comment-msg');

    const commentsRef = firebase.database().ref('comments/' + bookId);

    // Kullanıcı giriş durumunu izle
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            submitCommentBtn.disabled = false;
            commentMsg.textContent = '';
        } else {
            submitCommentBtn.disabled = true;
            commentMsg.textContent = 'Please login to add comments.';
        }
    });

    // Yorumları listele
    commentsRef.off();
    commentsRef.on('value', snapshot => {
        commentsList.innerHTML = '';
        const comments = snapshot.val();
        if (comments) {
            const sortedComments = Object.values(comments).sort((a, b) => a.timestamp - b.timestamp);
            sortedComments.forEach(comment => {
                const div = document.createElement('div');
                div.style.borderBottom = '1px solid #ddd';
                div.style.padding = '8px 0';
                div.innerHTML = `<b>${escapeHtml(comment.userName)}</b><br>${escapeHtml(comment.text)}`;
                commentsList.appendChild(div);
            });
        } else {
            commentsList.textContent = '';
        }
    });

    // Yorum ekle
    submitCommentBtn.addEventListener('click', () => {
        const user = firebase.auth().currentUser;
        const text = commentInput.value.trim();

        if (!user) {
            commentMsg.textContent = "You must be logged in to comment.";
            return;
        }
        if (!text) {
            commentMsg.textContent = "Comment cannot be empty.";
            return;
        }

        const userName = user.displayName || user.email.split('@')[0];
        const newComment = {
            userId: user.uid,
            userName: userName,
            text: text,
            timestamp: Date.now()
        };

        commentsRef.push(newComment)
            .then(() => {
                commentInput.value = '';
                commentMsg.style.color = 'green';
                commentMsg.textContent = "Comment added!";
            })
            .catch(err => {
                commentMsg.style.color = 'red';
                commentMsg.textContent = "Error adding comment: " + err.message;
            });
    });
}
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}
if (!navigator.onLine) {
    document.body.innerHTML = "<p>No internet connection. Access to the site is not available.</p>";
}



function initRating(bookId) {
    const stars = document.querySelectorAll("#star-rating span");
    const ratingMsg = document.getElementById("rating-msg");

    // Mevcut ortalama oy bilgisini çek
    firebase.database().ref(`ratings/${bookId}`).once("value").then(snapshot => {
        const data = snapshot.val();
        if (data && data.average) {
            highlightStars(Math.round(data.average));
            ratingMsg.textContent = `Current rating: ${data.average.toFixed(1)} (${data.count} votes)`;
        } else {
            highlightStars(0);
            ratingMsg.textContent = `No ratings yet.`;
        }
    });

    stars.forEach(star => {
        star.addEventListener("mouseenter", () => {
            const val = parseInt(star.dataset.value);
            highlightStars(val);
        });
        star.addEventListener("mouseleave", () => {
            firebase.database().ref(`ratings/${bookId}`).once("value").then(snapshot => {
                const data = snapshot.val();
                if (data && data.average) {
                    highlightStars(Math.round(data.average));
                } else {
                    highlightStars(0);
                }
            });
        });

        star.addEventListener("click", () => {
            const val = parseInt(star.dataset.value);

            // Kullanıcı kontrolü yap
            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Please login to rate this book.");
                return;
            }

            const userId = user.uid;
            const ratingRef = firebase.database().ref(`ratings/${bookId}`);

            ratingRef.transaction(currentData => {
                if (currentData === null) {
                    return {
                        count: 1,
                        total: val,
                        average: val,
                        users: {
                            [userId]: val
                        }
                    };
                } else {
                    if (currentData.users && currentData.users[userId] !== undefined) {
                        // Kullanıcı oyunu güncelle
                        currentData.total = currentData.total - currentData.users[userId] + val;
                        currentData.users[userId] = val;
                    } else {
                        // Yeni oy
                        currentData.count++;
                        currentData.total += val;
                        if (!currentData.users) currentData.users = {};
                        currentData.users[userId] = val;
                    }
                    currentData.average = currentData.total / currentData.count;
                    return currentData;
                }
            }).then(() => {
                ratingMsg.textContent = `Thanks for rating!`;
                highlightStars(val);
            }).catch(err => {
                alert("Error saving rating: " + err.message);
            });
        });
    });

    function highlightStars(rating) {
        stars.forEach(star => {
            star.style.color = parseInt(star.dataset.value) <= rating ? "darkorange" : "#ccc";
        });
    }
}
