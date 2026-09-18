/* =====================================================
   DRINKLY
   Marketplace Drink Application
   ===================================================== */


/* ================= API ================= */

const API =
    "https://www.thecocktaildb.com/api/json/v1/1/";

const MAX_GROUP = 7;


/* ================= STATE ================= */

let selectedDrinks = [];

let allDrinks = [];

let currentCategory = "all";

const cache = new Map();

const usedCollectionIds =
    new Set();


/* ================= ELEMENTS ================= */

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const drinksContainer =
    document.getElementById("drinksContainer");

const resultText =
    document.getElementById("resultText");

const filterName =
    document.getElementById("filterName");

const resetFilter =
    document.getElementById("resetFilter");

const selectedDrinksList =
    document.getElementById("selectedDrinks");

const drinkCount =
    document.getElementById("drinkCount");

const currentCount =
    document.getElementById("currentCount");

const navCount =
    document.getElementById("navCount");

const progressBar =
    document.getElementById("progressBar");

const subtotalElement =
    document.getElementById("subtotal");

const totalDiscountElement =
    document.getElementById("totalDiscount");

const grandTotalElement =
    document.getElementById("grandTotal");

const modal =
    document.getElementById("detailsModal");

const modalBody =
    document.getElementById("modalBody");

const closeModalBtn =
    document.getElementById("closeModal");

const toast =
    document.getElementById("toast");


/* ================= INITIALIZE ================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    await loadDefaultDrinks();

    await loadCollections();

    updateGroup();

}


/* =====================================================
   API REQUEST
   ===================================================== */

async function apiRequest(endpoint) {

    if (cache.has(endpoint)) {

        return cache.get(endpoint);

    }


    const response =
        await fetch(API + endpoint);


    if (!response.ok) {

        throw new Error(
            "API request failed"
        );

    }


    const data =
        await response.json();


    cache.set(
        endpoint,
        data
    );


    return data;

}


/* =====================================================
   DEFAULT 10 DRINKS
   ===================================================== */

async function loadDefaultDrinks() {

    showLoading();


    try {

        const data =
            await apiRequest(
                "search.php?f=a"
            );


        const basicDrinks =
            uniqueDrinks(
                data.drinks || []
            ).slice(0, 10);


        allDrinks =
            await enrichDrinks(
                basicDrinks
            );


        currentCategory =
            "all";


        setCategoryUI("all");


        resultText.textContent =
            `Showing ${allDrinks.length} drinks`;


        renderProducts();


    } catch (error) {

        console.error(error);

        showError(
            "Unable to load drinks. Please check your internet connection."
        );

    }

}


/* =====================================================
   SEARCH
   ===================================================== */

searchBtn.addEventListener(
    "click",
    searchDrinks
);


searchInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            searchDrinks();

        }

    }
);


async function searchDrinks() {

    const query =
        searchInput.value.trim();


    if (!query) {

        await loadDefaultDrinks();

        return;

    }


    showLoading();


    try {

        const data =
            await apiRequest(
                "search.php?s=" +
                encodeURIComponent(query)
            );


        const basicDrinks =
            uniqueDrinks(
                data.drinks || []
            );


        if (basicDrinks.length === 0) {

            resultText.textContent =
                "0 results";


            drinksContainer.innerHTML = `

                <div class="not-found">

                    <h2>
                        No drinks found
                    </h2>

                    <p style="margin-top:7px">

                        We couldn't find a drink
                        matching
                        "${escapeHtml(query)}".

                    </p>

                </div>

            `;

            return;

        }


        allDrinks =
            await enrichDrinks(
                basicDrinks
            );


        currentCategory =
            "all";


        setCategoryUI("all");


        resultText.textContent =
            `Found ${allDrinks.length} result${
                allDrinks.length === 1
                    ? ""
                    : "s"
            }`;


        renderProducts();


        document
            .getElementById("drinks")
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error(error);

        showError(
            "Search failed. Please try again."
        );

    }

}


/* =====================================================
   CATEGORY
   ===================================================== */

document
    .querySelectorAll(".category-item")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                loadCategory(
                    button.dataset.category
                );

            }
        );

    });


document
    .querySelectorAll(".browse-card")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                loadCategory(
                    button.dataset.category
                );

            }
        );

    });


resetFilter.addEventListener(
    "click",
    function() {

        searchInput.value = "";

        loadDefaultDrinks();

    }
);


async function loadCategory(category) {

    if (category === "all") {

        await loadDefaultDrinks();

        return;

    }


    showLoading();


    try {

        let data;


        if (category === "Non_Alcoholic") {

            data =
                await apiRequest(
                    "filter.php?a=Non_Alcoholic"
                );

        } else {

            data =
                await apiRequest(
                    "filter.php?c=" +
                    encodeURIComponent(category)
                );

        }


        const basicDrinks =
            uniqueDrinks(
                data.drinks || []
            );


        if (basicDrinks.length === 0) {

            drinksContainer.innerHTML = `

                <div class="not-found">

                    <h2>
                        No drinks available
                    </h2>

                    <p style="margin-top:7px">
                        Try another category.
                    </p>

                </div>

            `;

            return;

        }


        allDrinks =
            await enrichDrinks(
                basicDrinks
            );


        currentCategory =
            category;


        setCategoryUI(category);


        resultText.textContent =
            `${allDrinks.length} drinks`;


        renderProducts();


        document
            .getElementById("drinks")
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error(error);

        showError(
            "Unable to load this category."
        );

    }

}


/* =====================================================
   ENRICH DATA
   ===================================================== */

async function enrichDrinks(drinks) {

    const limited =
        drinks.slice(0, 30);


    const details =
        await Promise.all(

            limited.map(
                async function(drink) {

                    try {

                        const data =
                            await apiRequest(
                                "lookup.php?i=" +
                                drink.idDrink
                            );


                        return (
                            data.drinks &&
                            data.drinks[0]
                        ) || drink;

                    } catch {

                        return drink;

                    }

                }
            )

        );


    return uniqueDrinks(details);

}


/* =====================================================
   CATEGORY UI
   ===================================================== */

function setCategoryUI(category) {

    document
        .querySelectorAll(".category-item")
        .forEach(function(button) {

            button.classList.toggle(
                "active",
                button.dataset.category === category
            );

        });


    const names = {

        all:
            "All Drinks",

        Cocktail:
            "Cocktails",

        "Ordinary Drink":
            "Classic Drinks",

        "Punch / Party Drink":
            "Party Drinks",

        Shake:
            "Shakes",

        "Coffee / Tea":
            "Coffee & Tea",

        Non_Alcoholic:
            "Non-Alcoholic"

    };


    filterName.textContent =
        names[category] ||
        "Drinks";

}


/* =====================================================
   PRODUCT RENDER
   ===================================================== */

function renderProducts() {

    drinksContainer.innerHTML = "";


    if (allDrinks.length === 0) {

        drinksContainer.innerHTML = `

            <div class="not-found">

                <h2>
                    No drinks found
                </h2>

            </div>

        `;

        return;

    }


    allDrinks.forEach(
        function(drink) {

            drinksContainer.appendChild(
                createProductCard(drink)
            );

        }
    );

}


/* =====================================================
   PRICE SYSTEM
   ===================================================== */

function getPriceData(drink) {

    const id =
        parseInt(
            drink.idDrink,
            10
        ) || 100;


    /*
     * Generates consistent demo
     * marketplace prices.
     */

    const basePrice =
        7.50 +
        (id % 12) * 0.75;


    const discount =
        10 +
        (id % 4) * 5;


    const discountAmount =
        basePrice *
        discount /
        100;


    const finalPrice =
        basePrice -
        discountAmount;


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


/* =====================================================
   PRODUCT CARD
   ===================================================== */

function createProductCard(drink) {

    const card =
        document.createElement("article");


    card.className =
        "product-card";


    const name =
        drink.strDrink ||
        "Drink";


    const category =
        drink.strCategory ||
        (
            currentCategory !== "all"
                ? getCategoryLabel(
                    currentCategory
                )
                : "Featured Drink"
        );


    const instruction =
        drink.strInstructions ||
        "Discover this drink.";


    const alreadyAdded =
        selectedDrinks.some(
            function(item) {

                return item.name === name;

            }
        );


    const alcoholic =
        drink.strAlcoholic ===
        "Non_Alcoholic"
            ? "NON-ALCOHOLIC"
            : "ALCOHOLIC";


    const price =
        getPriceData(drink);


    card.innerHTML = `

        <div class="product-image">

            <img
                src="${safeUrl(
                    drink.strDrinkThumb
                )}"
                alt="${escapeHtml(name)}"
                loading="lazy"
            >

            <span class="product-badge">
                ${alcoholic}
            </span>

        </div>


        <div class="product-body">

            <h3>
                ${escapeHtml(name)}
            </h3>


            <span class="product-category">

                ${escapeHtml(category)}

            </span>


            <p
                class="product-instruction"
                title="${escapeHtml(instruction)}"
            >

                ${escapeHtml(
                    truncate(
                        instruction,
                        15
                    )
                )}

            </p>


            <div class="price-area">

                <span class="old-price">

                    $${price.basePrice.toFixed(2)}

                </span>


                <span class="discount">

                    ${price.discount}% OFF

                </span>


                <strong class="final-price">

                    $${price.finalPrice.toFixed(2)}

                </strong>

            </div>


            <div class="product-actions">

                <button
                    class="add-btn"
                    type="button"
                    ${alreadyAdded ? "disabled" : ""}
                >

                    ${
                        alreadyAdded
                            ? "Added"
                            : "Add to Group"
                    }

                </button>


                <button
                    class="details-btn"
                    type="button"
                >

                    Details

                </button>

            </div>

        </div>

    `;


    card
        .querySelector(".add-btn")
        .addEventListener(
            "click",
            function() {

                addToGroup(
                    drink,
                    price
                );

            }
        );


    card
        .querySelector(".details-btn")
        .addEventListener(
            "click",
            function() {

                showDetails(
                    drink.idDrink
                );

            }
        );


    return card;

}


/* =====================================================
   ADD TO GROUP
   ===================================================== */

function addToGroup(drink, price) {

    if (
        selectedDrinks.length >=
        MAX_GROUP
    ) {

        alert(
            "You cannot add more than 7 drinks to the group!"
        );

        return;

    }


    const exists =
        selectedDrinks.some(
            function(item) {

                return item.id === drink.idDrink;

            }
        );


    if (exists) {

        alert(
            "This drink is already in your group!"
        );

        return;

    }


    selectedDrinks.push({

        id:
            drink.idDrink,

        name:
            drink.strDrink,

        price:
            price

    });


    updateGroup();

    renderProducts();


    showToast(
        "Drink added to your group."
    );

}


/* =====================================================
   UPDATE GROUP
   ===================================================== */

function updateGroup() {

    const count =
        selectedDrinks.length;


    drinkCount.textContent =
        count;


    currentCount.textContent =
        count;


    navCount.textContent =
        count;


    progressBar.style.width =
        (
            count /
            MAX_GROUP *
            100
        ) + "%";


    calculateTotals();


    if (count === 0) {

        selectedDrinksList.innerHTML = `

            <li class="empty">

                No drinks selected yet.

            </li>

        `;

        return;

    }


    selectedDrinksList.innerHTML =
        "";


    selectedDrinks.forEach(
        function(item, index) {

            const listItem =
                document.createElement("li");


            listItem.innerHTML = `

                <div class="selected-drink-info">

                    <span class="selected-drink-name">

                        ${index + 1}.
                        ${escapeHtml(item.name)}

                    </span>


                    <span class="selected-drink-price">

                        $${item.price.finalPrice.toFixed(2)}

                    </span>

                </div>


                <button
                    class="remove"
                    type="button"
                    aria-label="Remove drink"
                >

                    ×

                </button>

            `;


            listItem
                .querySelector(".remove")
                .addEventListener(
                    "click",
                    function() {

                        selectedDrinks.splice(
                            index,
                            1
                        );


                        updateGroup();

                        renderProducts();


                        showToast(
                            "Drink removed."
                        );

                    }
                );


            selectedDrinksList.appendChild(
                listItem
            );

        }
    );

}


/* =====================================================
   CALCULATE TOTALS
   ===================================================== */

function calculateTotals() {

    let subtotal = 0;

    let discount = 0;


    selectedDrinks.forEach(
        function(item) {

            subtotal +=
                item.price.basePrice;

            discount +=
                item.price.discountAmount;

        }
    );


    const total =
        subtotal - discount;


    subtotalElement.textContent =
        "$" +
        subtotal.toFixed(2);


    totalDiscountElement.textContent =
        "-$" +
        discount.toFixed(2);


    grandTotalElement.textContent =
        "$" +
        total.toFixed(2);

}


/* =====================================================
   COLLECTIONS
   ===================================================== */

async function loadCollections() {

    usedCollectionIds.clear();


    const collectionMap = [

        {
            element:
                "cocktailCollection",

            category:
                "Cocktail"

        },

        {
            element:
                "classicCollection",

            category:
                "Ordinary Drink"

        },

        {
            element:
                "partyCollection",

            category:
                "Punch / Party Drink"

        },

        {
            element:
                "zeroCollection",

            category:
                "Non_Alcoholic"

        }

    ];


    for (
        const collection
        of collectionMap
    ) {

        try {

            let data;


            if (
                collection.category ===
                "Non_Alcoholic"
            ) {

                data =
                    await apiRequest(
                        "filter.php?a=Non_Alcoholic"
                    );

            } else {

                data =
                    await apiRequest(
                        "filter.php?c=" +
                        encodeURIComponent(
                            collection.category
                        )
                    );

            }


            renderCollection(
                collection.element,
                data.drinks || []
            );


        } catch (error) {

            console.error(error);

        }

    }

}


/* =====================================================
   COLLECTION RENDER
   ===================================================== */

function renderCollection(
    elementId,
    drinks
) {

    const grid =
        document.getElementById(
            elementId
        );


    grid.innerHTML = "";


    let count = 0;


    for (
        const drink
        of uniqueDrinks(drinks)
    ) {

        if (
            usedCollectionIds.has(
                drink.idDrink
            )
        ) {

            continue;

        }


        usedCollectionIds.add(
            drink.idDrink
        );


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "collection-card";


        card.innerHTML = `

            <img
                src="${safeUrl(
                    drink.strDrinkThumb
                )}"
                alt="${escapeHtml(
                    drink.strDrink
                )}"
                loading="lazy"
            >


            <div class="collection-card-info">

                <strong>

                    ${escapeHtml(
                        drink.strDrink
                    )}

                </strong>


                <span>
                    Discover drink
                </span>

            </div>

        `;


        card.addEventListener(
            "click",
            function() {

                showDetails(
                    drink.idDrink
                );

            }
        );


        card.style.cursor =
            "pointer";


        grid.appendChild(card);


        count++;


        if (count >= 10) {

            break;

        }

    }

}


/* =====================================================
   SEE MORE
   ===================================================== */

document
    .querySelectorAll(".see-more")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const grid =
                    document.getElementById(
                        button.dataset.target
                    );


                const expanded =
                    grid.classList.toggle(
                        "expanded"
                    );


                button.innerHTML =
                    expanded
                        ? "Show Less ↑"
                        : "See More →";

            }
        );

    });


/* =====================================================
   DETAILS MODAL
   ===================================================== */

async function showDetails(id) {

    modal.classList.add("show");

    document.body.style.overflow =
        "hidden";


    modalBody.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            Loading details...

        </div>

    `;


    try {

        const data =
            await apiRequest(
                "lookup.php?i=" +
                encodeURIComponent(id)
            );


        const drink =
            data.drinks &&
            data.drinks[0];


        if (!drink) {

            throw new Error(
                "Drink not found"
            );

        }


        const ingredients = [];


        for (
            let i = 1;
            i <= 15;
            i++
        ) {

            const ingredient =
                drink[
                    "strIngredient" + i
                ];


            const measure =
                drink[
                    "strMeasure" + i
                ];


            if (ingredient) {

                ingredients.push(`

                    <div class="ingredient">

                        ${escapeHtml(
                            (
                                measure ||
                                ""
                            ).trim()
                        )}

                        ${escapeHtml(
                            ingredient
                        )}

                    </div>

                `);

            }

        }


        const price =
            getPriceData(drink);


        modalBody.innerHTML = `

            <img
                class="modal-image"
                src="${safeUrl(
                    drink.strDrinkThumb
                )}"
                alt="${escapeHtml(
                    drink.strDrink
                )}"
            >


            <h2>

                ${escapeHtml(
                    drink.strDrink
                )}

            </h2>


            <div class="modal-info">

                <div>

                    <strong>
                        Category
                    </strong>

                    ${escapeHtml(
                        drink.strCategory ||
                        "Drink"
                    )}

                </div>


                <div>

                    <strong>
                        Type
                    </strong>

                    ${escapeHtml(
                        drink.strAlcoholic ||
                        "N/A"
                    )}

                </div>


                <div>

                    <strong>
                        Glass
                    </strong>

                    ${escapeHtml(
                        drink.strGlass ||
                        "N/A"
                    )}

                </div>


                <div>

                    <strong>
                        Price
                    </strong>

                    $${price.finalPrice.toFixed(2)}

                </div>

            </div>


            <h3>
                Instructions
            </h3>


            <p>

                ${escapeHtml(
                    drink.strInstructions ||
                    "No instructions available."
                )}

            </p>


            <h3>
                Ingredients & Measurements
            </h3>


            <div class="ingredients">

                ${
                    ingredients.length
                        ? ingredients.join("")
                        : "<p>No ingredients listed.</p>"
                }

            </div>

        `;


    } catch (error) {

        console.error(error);

        modalBody.innerHTML = `

            <div class="not-found">

                <h2>
                    Details unavailable
                </h2>

                <p style="margin-top:7px">
                    Unable to load drink details.
                </p>

            </div>

        `;

    }

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

closeModalBtn.addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


function closeModal() {

    modal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


/* =====================================================
   HELPERS
   ===================================================== */

function uniqueDrinks(drinks) {

    const seen =
        new Set();


    return drinks.filter(
        function(drink) {

            if (
                !drink ||
                !drink.idDrink ||
                seen.has(
                    drink.idDrink
                )
            ) {

                return false;

            }


            seen.add(
                drink.idDrink
            );


            return true;

        }
    );

}


function getCategoryLabel(category) {

    const labels = {

        Cocktail:
            "Cocktails",

        "Ordinary Drink":
            "Classic Drink",

        "Punch / Party Drink":
            "Party Drink",

        Shake:
            "Shake",

        "Coffee / Tea":
            "Coffee & Tea",

        Non_Alcoholic:
            "Non-Alcoholic"

    };


    return (
        labels[category] ||
        "Featured Drink"
    );

}


function truncate(text, max) {

    if (
        text.length <= max
    ) {

        return text;

    }


    return (
        text.slice(0, max) +
        "..."
    );

}


function safeUrl(url) {

    return /^https?:\/\//i.test(
        url || ""
    )
        ? url
        : "";

}


function escapeHtml(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        function(character) {

            return {

                "&":
                    "&amp;",

                "<":
                    "&lt;",

                ">":
                    "&gt;",

                '"':
                    "&quot;",

                "'":
                    "&#039;"

            }[character];

        }
    );

}


/* =====================================================
   LOADING / ERROR
   ===================================================== */

function showLoading() {

    drinksContainer.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            Loading drinks...

        </div>

    `;

}


function showError(message) {

    drinksContainer.innerHTML = `

        <div class="not-found">

            <h2>
                Something went wrong
            </h2>

            <p style="margin-top:7px">

                ${escapeHtml(message)}

            </p>

        </div>

    `;

}


/* =====================================================
   TOAST
   ===================================================== */

function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2000
        );

}