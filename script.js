const API =
    "https://www.thecocktaildb.com/api/json/v1/1/";

const MAX_GROUP = 7;

let selectedDrinks = [];
let allDrinks = [];
let currentCategory = "all";

const cache = new Map();
const usedCollectionIds = new Set();


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


document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    await loadDefaultDrinks();

    await loadCollections();

    updateGroup();

}


/* ================= API ================= */

async function apiRequest(endpoint) {

    if (cache.has(endpoint)) {
        return cache.get(endpoint);
    }

    const response =
        await fetch(API + endpoint);

    if (!response.ok) {
        throw new Error("API request failed");
    }

    const data =
        await response.json();

    cache.set(endpoint, data);

    return data;
}


/* ================= DEFAULT ================= */

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

        currentCategory = "all";

        setCategoryUI("all");

        resultText.textContent =
            `Showing ${allDrinks.length} drinks`;

        renderProducts();

    } catch (error) {

        console.error(error);

        showError(
            "Unable to load drinks."
        );

    }
}


/* ================= SEARCH ================= */

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

        if (!basicDrinks.length) {

            resultText.textContent =
                "0 results";

            drinksContainer.innerHTML = `

                <div class="not-found">

                    <h2>No drinks found</h2>

                    <p style="margin-top:7px">
                        We couldn't find "${escapeHtml(query)}".
                    </p>

                </div>

            `;

            return;
        }

        allDrinks =
            await enrichDrinks(
                basicDrinks
            );

        currentCategory = "all";

        setCategoryUI("all");

        resultText.textContent =
            `Found ${allDrinks.length} result${
                allDrinks.length === 1 ? "" : "s"
            }`;

        renderProducts();

        document
            .getElementById("drinks")
            .scrollIntoView({
                behavior:"smooth"
            });

    } catch (error) {

        console.error(error);

        showError(
            "Search failed."
        );

    }

}


/* ================= CATEGORY ================= */

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

        if (!basicDrinks.length) {

            drinksContainer.innerHTML = `

                <div class="not-found">

                    <h2>
                        No drinks available
                    </h2>

                </div>

            `;

            return;
        }

        allDrinks =
            await enrichDrinks(
                basicDrinks
            );

        currentCategory = category;

        setCategoryUI(category);

        resultText.textContent =
            `${allDrinks.length} drinks`;

        renderProducts();

        document
            .getElementById("drinks")
            .scrollIntoView({
                behavior:"smooth"
            });

    } catch (error) {

        console.error(error);

        showError(
            "Unable to load this category."
        );

    }

}


/* ================= ENRICH ================= */

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


/* ================= CATEGORY UI ================= */

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

        all:"All Drinks",

        Cocktail:"Cocktails",

        "Ordinary Drink":"Classic Drinks",

        "Punch / Party Drink":"Party Drinks",

        Shake:"Shakes",

        "Coffee / Tea":"Coffee & Tea",

        Non_Alcoholic:"Non-Alcoholic"

    };

    filterName.textContent =
        names[category] || "Drinks";

}


/* ================= PRICE ================= */

function getPriceData(drink) {

    const id =
        parseInt(
            drink.idDrink,
            10
        ) || 100;


    const basePrice =
        500 + (id % 11) * 75;


    const discount =
        10 + (id % 4) * 5;


    const discountAmount =
        basePrice *
        discount /
        100;


    const finalPrice =
        basePrice -
        discountAmount;


    return {

        basePrice:
            Math.round(basePrice),

        discount,

        discountAmount:
            Math.round(discountAmount),

        finalPrice:
            Math.round(finalPrice)

    };

}


function formatPrice(price) {

    return "৳" +
        price.toLocaleString("en-BD");

}


/* ================= PRODUCTS ================= */

function renderProducts() {

    drinksContainer.innerHTML = "";

    if (!allDrinks.length) {

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


/* ================= PRODUCT CARD ================= */

function createProductCard(drink) {

    const card =
        document.createElement("article");

    card.className =
        "product-card";


    const name =
        drink.strDrink || "Drink";


    const category =
        drink.strCategory ||
        (
            currentCategory !== "all"
                ? getCategoryLabel(currentCategory)
                : "Featured Drink"
        );


    const instruction =
        drink.strInstructions ||
        "Discover this drink.";


    const price =
        getPriceData(drink);


    const alreadyAdded =
        selectedDrinks.some(
            function(item) {
                return item.id === drink.idDrink;
            }
        );


    const alcoholic =
        drink.strAlcoholic === "Non_Alcoholic"
            ? "NON-ALCOHOLIC"
            : "ALCOHOLIC";


    card.innerHTML = `

        <div class="product-image">

            <img
                src="${safeUrl(drink.strDrinkThumb)}"
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
                    truncate(instruction,15)
                )}

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


/* ================= ADD TO GROUP ================= */

function addToGroup(drink, price) {

    if (
        selectedDrinks.length >= MAX_GROUP
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


/* ================= GROUP ================= */

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


    if (!count) {

        selectedDrinksList.innerHTML = `

            <li class="empty">

                No drinks selected yet.

            </li>

        `;

        return;
    }


    selectedDrinksList.innerHTML = "";


    selectedDrinks.forEach(
        function(item,index) {

            const li =
                document.createElement("li");


            li.innerHTML = `

                <div class="selected-drink-info">

                    <span class="selected-drink-name">

                        ${index + 1}.
                        ${escapeHtml(item.name)}

                    </span>


                    <span class="selected-drink-price">

                        ${formatPrice(
                            item.price.finalPrice
                        )}

                    </span>

                </div>


                <button
                    class="remove"
                    type="button"
                >

                    ×

                </button>

            `;


            li
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


            selectedDrinksList.appendChild(li);

        }
    );

}


/* ================= TOTAL CALCULATION ================= */

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
        formatPrice(
            subtotal
        );


    totalDiscountElement.textContent =
        "-" +
        formatPrice(
            discount
        );


    grandTotalElement.textContent =
        formatPrice(
            total
        );

}


/* ================= COLLECTIONS ================= */

async function loadCollections() {

    usedCollectionIds.clear();


    const collectionMap = [

        {
            element:"cocktailCollection",
            category:"Cocktail"
        },

        {
            element:"classicCollection",
            category:"Ordinary Drink"
        },

        {
            element:"partyCollection",
            category:"Punch / Party Drink"
        },

        {
            element:"zeroCollection",
            category:"Non_Alcoholic"
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

        } catch(error) {

            console.error(error);

        }

    }

}


/* ================= COLLECTION RENDER ================= */

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


        grid.appendChild(card);


        count++;


        if (count >= 10) {
            break;
        }

    }

}


/* ================= SEE MORE ================= */

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


                button.textContent =
                    expanded
                        ? "Show Less ↑"
                        : "See More →";

            }
        );

    });


/* ================= DETAILS ================= */

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


        const price =
            getPriceData(drink);


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
                                measure || ""
                            ).trim()
                        )}

                        ${escapeHtml(
                            ingredient
                        )}

                    </div>

                `);

            }

        }


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

                    ${formatPrice(
                        price.finalPrice
                    )}

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

    } catch(error) {

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


/* ================= CLOSE MODAL ================= */

closeModalBtn.addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    function(event) {

        if (event.target === modal) {
            closeModal();
        }

    }
);


document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {
            closeModal();
        }

    }
);


function closeModal() {

    modal.classList.remove("show");

    document.body.style.overflow = "";

}


/* ================= HELPERS ================= */

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

        Cocktail:"Cocktails",

        "Ordinary Drink":"Classic Drink",

        "Punch / Party Drink":"Party Drink",

        Shake:"Shake",

        "Coffee / Tea":"Coffee & Tea",

        Non_Alcoholic:"Non-Alcoholic"

    };


    return (
        labels[category] ||
        "Featured Drink"
    );

}


function truncate(text,max) {

    if (text.length <= max) {
        return text;
    }

    return text.slice(0,max) + "...";

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

                "&":"&amp;",
                "<":"&lt;",
                ">":"&gt;",
                '"':"&quot;",
                "'":"&#039;"

            }[character];

        }
    );

}


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


function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add("show");

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