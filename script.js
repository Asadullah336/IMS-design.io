let isAdmin = false;

    function toggleLogin() {
      if (!isAdmin) {
        const user = prompt("Username:");
        const pass = prompt("Password:");
        if (user === "admin" && pass === "1234") {
          isAdmin = true;
          document.getElementById("loginBtn").innerText = "Logout";
          showAdminUI(true);
        } else {
          alert("Wrong credentials");
        }
      } else {
        isAdmin = false;
        document.getElementById("loginBtn").innerText = "Login";
        showAdminUI(false);
      }
    }

    function showAdminUI(show) {
      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.style.display = show ? "inline-block" : "none";
      });
      document.getElementById("addBtn").style.display = show ? "block" : "none";
      document.querySelectorAll(".edit-form").forEach(form => {
        form.style.display = "none";
      });
    }

    function loadCards() {
      const container = document.getElementById("cardContainer");
      container.innerHTML = "";
      const products = JSON.parse(localStorage.getItem("products")) || [];

      products.forEach((p, i) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <img src="${p.image}" alt="Product">
          <div class="price">$ ${p.price}</div>
          <a href="${p.link}" target="_blank" class="buy-btn">Buy Now</a>
          <button class="edit-btn" onclick="toggleEditForm(this)">Edit</button>

          <div class="edit-form">
            <input type="file" accept="image/*" class="image-upload">
            <input type="text" placeholder="Price" value="${p.price}" class="edit-price">
            <input type="url" placeholder="Buy Now link" value="${p.link}" class="edit-link">
            <button onclick="saveChanges(this, ${i})">Save</button>
          </div>
        `;
        container.appendChild(card);
      });

      showAdminUI(isAdmin);
    }

    function toggleEditForm(btn) {
      const form = btn.nextElementSibling;
      form.style.display = form.style.display === "block" ? "none" : "block";
    }

    function saveChanges(saveBtn, index) {
      const form = saveBtn.parentElement;
      const imageInput = form.querySelector(".image-upload");
      const newPrice = form.querySelector(".edit-price").value;
      const newLink = form.querySelector(".edit-link").value;

      const products = JSON.parse(localStorage.getItem("products")) || [];

      // Update price and link
      if (newPrice) products[index].price = newPrice;
      if (newLink) products[index].link = newLink;

      // If image selected, use FileReader
      if (imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          products[index].image = e.target.result;
          localStorage.setItem("products", JSON.stringify(products));
          loadCards();
        }
        reader.readAsDataURL(imageInput.files[0]);
      } else {
        localStorage.setItem("products", JSON.stringify(products));
        loadCards();
      }
    }

    function addCard() {
      const price = prompt("Enter price:");
      const link = prompt("Enter Buy Now link:");
      if (!price || !link) return;

      const defaultImage = "https://via.placeholder.com/200";
      const products = JSON.parse(localStorage.getItem("products")) || [];

      products.push({
        image: defaultImage,
        price: price,
        link: link
      });

      localStorage.setItem("products", JSON.stringify(products));
      loadCards();
    }

    // Load cards on page load
    window.onload = loadCards;