const API_BASE =
    "https://www.thecocktaildb.com/api/json/v1/1/";


/* ================= STATE ================= */

let allDrinks = [];
let selectedDrinks = [];

let currentCategory = "all";
let currentSearch = "";

let popularOffset = 0;


/* ================= DOM ================= */

const productGrid =
    document.getElementById("productGrid");

const popularGrid =
    document.getElementById("popularGrid");

const classicGrid =
    document.getElementById("classicGrid");

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const loading =
    document.getElementById("loading");

const notFound =
    document.getElementById("notFound");

const productTitle =
    document.getElementById("productTitle");

const resultInfo =
    document.getElementById("resultInfo");

const drinkCount =
    document.getElementById("drinkCount");

const groupList =
    document.getElementById("groupList");

const groupCount =
    document.getElementById("groupCount");

const headerGroupCount =
    document.getElementById("headerGroupCount");

const subtotalElement =
    document.getElementById("subtotal");

const totalDiscountElement =
    document.getElementById("totalDiscount");

const grandTotalElement =
    document.getElementById("grandTotal");

const detailsModal =
    document.getElementById("detailsModal");

const modalContent =
    document.getElementById("modalContent");


/* ================= INITIAL LOAD ================= */

document.addEventListener("DOMContentLoaded", function () {

    loadDefaultDrinks();

    setupSearch();

    setupCategories();

});


/* ================= API ================= */

async function fetchDrinks(endpoint) {

    try {

        const response =
            await fetch(API_BASE + endpoint);

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data =
            await response.json();

        return data.drinks || [];

    } catch (error) {

        console.error(error);

        return [];

    }
}


/* ================= DEFAULT DRINKS ================= */

async function loadDefaultDrinks() {

    showLoading(true);

    /*
        Assignment requirement:
        Initial page should display 10 drinks.
        Using search.php?f=a because it is
        available through the free API.
    */

    let drinks =
        await fetchDrinks("search.php?f=a");

    drinks =
        drinks.slice(0, 10);

    allDrinks = drinks;

    renderProducts(allDrinks);

    loadCollections();

    showLoading(false);

}


/* ================= SEARCH ================= */

function setupSearch() {

    searchBtn.addEventListener("click", function () {

        performSearch();

    });


    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            performSearch();

        }

    });

}


async function performSearch() {

    const query =
        searchInput.value.trim();

    currentSearch = query;
    currentCategory = "all";

    setActiveCategory("all");

    if (!query) {

        loadDefaultDrinks();

        return;

    }


    showLoading(true);

    notFound.style.display = "none";

    productGrid.innerHTML = "";


    const drinks =
        await fetchDrinks(
            "search.php?s=" +
            encodeURIComponent(query)
        );


    showLoading(false);


    if (!drinks.length) {

        productTitle.textContent =
            "Search Results";

        resultInfo.textContent =
            `No results for "${query}"`;

        drinkCount.textContent = "0";

        notFound.style.display = "block";

        return;

    }


    allDrinks = drinks;

    productTitle.textContent =
        `Results for "${query}"`;

    resultInfo.textContent =
        "Matching drinks";

    renderProducts(drinks);

}


/* ================= CATEGORY ================= */

function setupCategories() {

    const buttons =
        document.querySelectorAll(".category-btn");

    buttons.forEach(function (button) {

        button.addEventListener("click", async function () {

            const category =
                this.dataset.category;

            currentCategory = category;
            currentSearch = "";

            searchInput.value = "";

            setActiveCategory(category);

            if (category === "all") {

                await loadDefaultDrinks();

                return;

            }


            showLoading(true);

            notFound.style.display = "none";

            productGrid.innerHTML = "";


            let endpoint =
                "filter.php?c=" +
                encodeURIComponent(category);


            if (category === "Non_Alcoholic") {

                endpoint =
                    "filter.php?a=Non_Alcoholic";

            }


            const drinks =
                await fetchDrinks(endpoint);


            showLoading(false);


            if (!drinks.length) {

                notFound.style.display = "block";

                drinkCount.textContent = "0";

                productTitle.textContent =
                    category.replaceAll("_", " ");

                resultInfo.textContent =
                    "No drinks available";

                return;

            }


            /*
                filter.php returns only IDs/names.
                Enriching with lookup.php gives
                complete drink information.
            */

            const enriched =
                await enrichDrinks(drinks.slice(0, 18));


            allDrinks = enriched;

            productTitle.textContent =
                category.replaceAll("_", " ");

            resultInfo.textContent =
                "Drinks in this category";

            renderProducts(enriched);

        });

    });

}


function setActiveCategory(category) {

    document
        .querySelectorAll(".category-btn")
        .forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.category === category
            );

        });

}


/* ================= ENRICH DRINK DATA ================= */

async function enrichDrinks(drinks) {

    const result = [];

    /*
        Keep requests controlled so the API
        is not overloaded.
    */

    for (const drink of drinks) {

        if (drink.strInstructions) {

            result.push(drink);

            continue;

        }


        const details =
            await fetchDrinks(
                "lookup.php?i=" +
                drink.idDrink
            );


        if (details.length) {

            result.push(details[0]);

        }

    }

    return result;

}


/* ================= PRICE SYSTEM ================= */

function getPriceData(drink) {

    const id =
        parseInt(drink.idDrink, 10) || 100;


    /*
        Demo marketplace pricing.
        Dollar instead of Taka.
    */

    const basePrice =
        5 + (id % 11) * 1.25;


    const discount =
        10 + (id % 4) * 5;


    const discountAmount =
        basePrice * discount / 100;


    const finalPrice =
        basePrice - discountAmount;


    return {

        basePrice:
            Number(basePrice.toFixed(2)),

        discount,

        discountAmount:
            Number(discountAmount.toFixed(2)),

        finalPrice:
            Number(finalPrice.toFixed(2))

    };

}


/* ================= DOLLAR FORMAT ================= */

function formatPrice(price) {

    return "$" +
        Number(price).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


/* ================= PRODUCT RENDER ================= */

function renderProducts(drinks) {

    productGrid.innerHTML = "";

    drinkCount.textContent =
        drinks.length;


    if (!drinks.length) {

        notFound.style.display = "block";

        return;

    }


    notFound.style.display = "none";


    drinks.forEach(function (drink) {

        productGrid.appendChild(
            createProductCard(drink)
        );

    });

}


function createProductCard(drink) {

    const card =
        document.createElement("article");

    card.className =
        "product-card";


    const price =
        getPriceData(drink);


    const instruction =
        limitText(
            drink.strInstructions ||
            "Refreshing drink",
            15
        );


    const isAdded =
        selectedDrinks.some(
            item =>
                item.id === drink.idDrink
        );


    card.innerHTML = `

        <div class="product-image">

            <img
                src="${drink.strDrinkThumb}"
                alt="${escapeHtml(drink.strDrink)}"
                loading="lazy"
            >

            <span class="product-tag">
                ${price.discount}% OFF
            </span>

        </div>


        <div class="product-content">

            <div class="product-category">
                ${escapeHtml(
                    drink.strCategory ||
                    "Drink"
                )}
            </div>


            <h3 class="product-name">
                ${escapeHtml(
                    drink.strDrink
                )}
            </h3>


            <p class="product-instruction">
                ${escapeHtml(instruction)}
            </p>


            <div class="price-area">

                <span class="old-price">
                    ${formatPrice(price.basePrice)}
                </span>

                <span class="discount">
                    ${price.discount}% OFF
                </span>

                <strong class="final-price">
                    ${formatPrice(price.finalPrice)}
                </strong>

            </div>


            <div class="product-actions">

                <button
                    class="add-btn ${isAdded ? "added" : ""}"
                    onclick='addToGroup(${JSON.stringify(drink)}, ${JSON.stringify(price)}, this)'
                >
                    ${isAdded ? "Added" : "Add to Group"}
                </button>


                <button
                    class="details-btn"
                    onclick='showDetails(${JSON.stringify(drink)})'
                >
                    Details
                </button>

            </div>

        </div>

    `;


    return card;

}


/* ================= TEXT LIMIT ================= */

function limitText(text, maxLength) {

    if (!text) {
        return "";
    }


    if (text.length <= maxLength) {
        return text;
    }


    return text.substring(0, maxLength) + "...";

}


/* ================= ADD TO GROUP ================= */

function addToGroup(drink, price, button) {

    const exists =
        selectedDrinks.some(
            item =>
                item.id === drink.idDrink
        );


    if (exists) {

        return;

    }


    if (selectedDrinks.length >= 7) {

        alert(
            "You can add maximum 7 drinks to the group."
        );

        return;

    }


    selectedDrinks.push({

        id: drink.idDrink,

        name: drink.strDrink,

        image: drink.strDrinkThumb,

        price: price

    });


    if (button) {

        button.textContent = "Added";

        button.classList.add("added");

    }


    updateGroup();

}


/* ================= GROUP UPDATE ================= */

function updateGroup() {

    groupCount.textContent =
        `${selectedDrinks.length}/7`;


    headerGroupCount.textContent =
        selectedDrinks.length;


    if (!selectedDrinks.length) {

        groupList.innerHTML = `

            <div class="empty-group">

                <div class="empty-icon">+</div>

                <h3>Your group is empty</h3>

                <p>
                    Add drinks from the collection.
                </p>

            </div>

        `;

        calculateTotals();

        return;

    }


    groupList.innerHTML = "";


    selectedDrinks.forEach(function (item) {

        const groupItem =
            document.createElement("div");

        groupItem.className =
            "group-item";


        groupItem.innerHTML = `

            <img
                class="group-item-image"
                src="${item.image}"
                alt="${escapeHtml(item.name)}"
            >


            <div class="group-item-info">

                <h4>
                    ${escapeHtml(item.name)}
                </h4>

                <span>
                    ${formatPrice(
                        item.price.finalPrice
                    )}
                </span>

            </div>


            <button
                class="remove-btn"
                onclick="removeFromGroup('${item.id}')"
            >
                &times;
            </button>

        `;


        groupList.appendChild(groupItem);

    });


    calculateTotals();

}


/* ================= REMOVE ================= */

function removeFromGroup(id) {

    selectedDrinks =
        selectedDrinks.filter(
            item =>
                item.id !== id
        );


    updateGroup();

    refreshProductButtons();

}


/* ================= CLEAR GROUP ================= */

function clearGroup() {

    selectedDrinks = [];

    updateGroup();

    refreshProductButtons();

}


/* ================= CALCULATE TOTALS ================= */

function calculateTotals() {

    let subtotal = 0;

    let discount = 0;


    selectedDrinks.forEach(function (item) {

        subtotal +=
            item.price.basePrice;

        discount +=
            item.price.discountAmount;

    });


    const total =
        subtotal - discount;


    subtotalElement.textContent =
        formatPrice(subtotal);


    totalDiscountElement.textContent =
        "-" + formatPrice(discount);


    grandTotalElement.textContent =
        formatPrice(total);

}


/* ================= REFRESH BUTTONS ================= */

function refreshProductButtons() {

    document
        .querySelectorAll(".add-btn")
        .forEach(function (button) {

            button.classList.remove("added");

            button.textContent =
                "Add to Group";

        });


    document
        .querySelectorAll(".product-card")
        .forEach(function (card) {

            const name =
                card.querySelector(
                    ".product-name"
                );

            if (!name) return;


            const drinkName =
                name.textContent.trim();


            const found =
                selectedDrinks.some(
                    item =>
                        item.name === drinkName
                );


            const button =
                card.querySelector(".add-btn");


            if (found && button) {

                button.classList.add("added");

                button.textContent =
                    "Added";

            }

        });

}


/* ================= MODAL ================= */

function showDetails(drink) {

    const ingredients = [];


    for (let i = 1; i <= 15; i++) {

        const ingredient =
            drink[`strIngredient${i}`];

        const measure =
            drink[`strMeasure${i}`];


        if (ingredient) {

            ingredients.push({

                ingredient:
                    ingredient.trim(),

                measure:
                    measure
                        ? measure.trim()
                        : ""

            });

        }

    }


    const ingredientHTML =
        ingredients.map(function (item) {

            return `

                <span class="ingredient">

                    ${escapeHtml(item.measure)}
                    ${escapeHtml(item.ingredient)}

                </span>

            `;

        }).join("");


    modalContent.innerHTML = `

        <div class="modal-content-grid">

            <img
                class="modal-image"
                src="${drink.strDrinkThumb}"
                alt="${escapeHtml(drink.strDrink)}"
            >


            <div class="modal-details">

                <span class="modal-category">

                    ${escapeHtml(
                        drink.strCategory ||
                        "Drink"
                    )}

                </span>


                <h2>
                    ${escapeHtml(drink.strDrink)}
                </h2>


                <div class="detail-row">

                    <strong>Type</strong>

                    <span>
                        ${escapeHtml(
                            drink.strAlcoholic ||
                            "Not specified"
                        )}
                    </span>

                </div>


                <div class="detail-row">

                    <strong>Glass</strong>

                    <span>
                        ${escapeHtml(
                            drink.strGlass ||
                            "Not specified"
                        )}
                    </span>

                </div>


                <div class="detail-row">

                    <strong>IBA</strong>

                    <span>
                        ${escapeHtml(
                            drink.strIBA ||
                            "Not specified"
                        )}
                    </span>

                </div>


                <div class="detail-row">

                    <strong>Instructions</strong>

                    <p>
                        ${escapeHtml(
                            drink.strInstructions ||
                            "No instructions available."
                        )}
                    </p>

                </div>


                <div class="detail-row">

                    <strong>Ingredients</strong>

                    <div class="ingredients">

                        ${ingredientHTML}

                    </div>

                </div>

            </div>

        </div>

    `;


    detailsModal.classList.add("show");

    document.body.style.overflow =
        "hidden";

}


/* ================= CLOSE MODAL ================= */

function closeModal() {

    detailsModal.classList.remove("show");

    document.body.style.overflow =
        "";

}


/* ================= COLLECTIONS ================= */

async function loadCollections() {

    const popular =
        await fetchDrinks(
            "search.php?f=m"
        );


    const classic =
        await fetchDrinks(
            "search.php?f=c"
        );


    renderCollection(
        popularGrid,
        popular.slice(0, 4)
    );


    renderCollection(
        classicGrid,
        classic.slice(0, 4)
    );

}


function renderCollection(container, drinks) {

    container.innerHTML = "";


    drinks.forEach(function (drink) {

        const price =
            getPriceData(drink);


        const card =
            document.createElement("article");

        card.className =
            "product-card";


        card.innerHTML = `

            <div class="product-image">

                <img
                    src="${drink.strDrinkThumb}"
                    alt="${escapeHtml(drink.strDrink)}"
                    loading="lazy"
                >

                <span class="product-tag">
                    ${price.discount}% OFF
                </span>

            </div>


            <div class="product-content">

                <div class="product-category">
                    ${escapeHtml(
                        drink.strCategory ||
                        "Drink"
                    )}
                </div>


                <h3 class="product-name">
                    ${escapeHtml(drink.strDrink)}
                </h3>


                <div class="price-area">

                    <span class="old-price">
                        ${formatPrice(price.basePrice)}
                    </span>

                    <span class="discount">
                        ${price.discount}% OFF
                    </span>

                    <strong class="final-price">
                        ${formatPrice(price.finalPrice)}
                    </strong>

                </div>


                <div class="product-actions">

                    <button
                        class="add-btn"
                        onclick='addToGroup(${JSON.stringify(drink)}, ${JSON.stringify(price)}, this)'
                    >
                        Add to Group
                    </button>


                    <button
                        class="details-btn"
                        onclick='showDetails(${JSON.stringify(drink)})'
                    >
                        Details
                    </button>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


/* ================= SEE MORE ================= */

async function loadMorePopular() {

    popularOffset += 4;


    const drinks =
        await fetchDrinks(
            "search.php?f=m"
        );


    const next =
        drinks.slice(
            popularOffset,
            popularOffset + 4
        );


    if (!next.length) {

        popularOffset = 0;

        popularGrid.innerHTML = "";

        renderCollection(
            popularGrid,
            drinks.slice(0, 4)
        );

        return;

    }


    renderCollection(
        popularGrid,
        next
    );

}


/* ================= UI HELPERS ================= */

function showLoading(show) {

    loading.style.display =
        show ? "block" : "none";

}


function scrollToGroup() {

    document
        .getElementById("group")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function scrollToDrinks() {

    document
        .getElementById("drinks")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* ================= SECURITY HELPER ================= */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ================= ESC KEY ================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            detailsModal.classList.contains("show")
        ) {

            closeModal();

        }

    }
);


/* ================= INITIAL GROUP ================= */

updateGroup();