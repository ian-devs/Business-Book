
const STORAGE_KEY = "biasharaBookSales";

const salesForm = document.getElementById("salesForm");
const productInput = document.getElementById("product");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");

const totalSalesDisplay = document.getElementById("totalSales");
const salesCountDisplay = document.getElementById("salesCount");
const itemsSoldDisplay = document.getElementById("itemsSold");
const salesTable = document.getElementById("salesTable");
const messageDisplay = document.getElementById("message");
const emptyMessage = document.getElementById("emptyMessage");
const clearButton = document.getElementById("clearButton");

// Load saved sales when the page opens.
let sales = loadSales();

// Format amounts as Kenyan shillings.
function formatMoney(amount) {
    return amount.toLocaleString("en-KE", {
        style: "currency",
        currency: "KES"
    });
}

// Safely load records from browser storage.
function loadSales() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData.filter(function(sale) {
            return (
                sale &&
                typeof sale.product === "string" &&
                sale.product.trim() !== "" &&
                Number.isSafeInteger(sale.quantity) &&
                sale.quantity > 0 &&
                Number.isFinite(sale.price) &&
                sale.price > 0 &&
                Number.isFinite(sale.total) &&
                sale.total > 0 &&
                typeof sale.date === "string"
            );
        });
    } catch (error) {
        return [];
    }
}

// Save records to browser storage.
function saveSales() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
        return true;
    } catch (error) {
        messageDisplay.textContent =
            "Could not save records. Check browser storage settings.";
        return false;
    }
}

// Add a new sale.
salesForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const product = productInput.value.trim();
    const quantity = Number(quantityInput.value);
    const price = Number(priceInput.value);
    const total = quantity * price;

    if (
        product === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1000000 ||
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 100000000 ||
        !Number.isFinite(total) ||
        !Number.isFinite(Math.round(total * 100) / 100)
    ) {
        messageDisplay.textContent =
            "Enter a product, a valid whole quantity, and a valid price.";
        return;
    }

    const sale = {
        id: Date.now().toString() + "-" +
            Math.random().toString(36).slice(2),
        date: new Date().toLocaleString("en-KE"),
        product: product,
        quantity: quantity,
        price: price,
        total: Math.round(total * 100) / 100
    };

    sales.push(sale);
    saveSales();
    renderSales();

    salesForm.reset();
    productInput.focus();

    messageDisplay.textContent =
        "Sale recorded: " + product + " — " + formatMoney(sale.total);
});

// Display sales and update dashboard statistics.
function renderSales() {
    salesTable.replaceChildren();

    let totalSales = 0;
    let totalItems = 0;

    sales.forEach(function(sale) {
        totalSales += sale.total;
        totalItems += sale.quantity;

        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent = sale.date;

        const productCell = document.createElement("td");
        productCell.textContent = sale.product;

        const quantityCell = document.createElement("td");
        quantityCell.textContent = sale.quantity;

        const priceCell = document.createElement("td");
        priceCell.textContent = formatMoney(sale.price);

        const totalCell = document.createElement("td");
        totalCell.textContent = formatMoney(sale.total);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteSale(sale.id);
        });

        actionCell.appendChild(deleteButton);

        row.append(
            dateCell,
            productCell,
            quantityCell,
            priceCell,
            totalCell,
            actionCell
        );

        salesTable.appendChild(row);
    });

    totalSalesDisplay.textContent = formatMoney(totalSales);
    salesCountDisplay.textContent = sales.length;
    itemsSoldDisplay.textContent = totalItems;

    emptyMessage.hidden = sales.length > 0;
}

// Delete one sale by its unique ID.
function deleteSale(id) {
    const previousSales = sales.slice();

    sales = sales.filter(function(sale) {
        return sale.id !== id;
    });

    if (!saveSales()) {
        sales = previousSales;
        return;
    }

    renderSales();
    messageDisplay.textContent = "Sale deleted.";
}

// Clear all sales after confirmation.
clearButton.addEventListener("click", function() {
    if (sales.length === 0) {
        messageDisplay.textContent = "There are no sales to clear.";
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete all recorded sales?"
    );

    if (!confirmed) {
        return;
    }

    const previousSales = sales.slice();
    sales = [];

    if (!saveSales()) {
        sales = previousSales;
        renderSales();
        return;
    }

    renderSales();
    messageDisplay.textContent = "All sales have been cleared.";
});

// Show saved records when the page first opens.
renderSales();
