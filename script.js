"use strict";


/* =========================================================
   DRINKMART
   TheCocktailDB V1
   ========================================================= */

const API =
    "https://www.thecocktaildb.com/api/json/v1/1/";

const MAX_GROUP = 7;

const INITIAL_LIMIT = 10;

const LOAD_BATCH = 10;


/* ================= STATE ================= */

let selectedDrinks = [];

let allDrinks = [];

let catalogBasics = [];

let catalogIndex = 0;

let currentMode = "default";

let currentCategory = "all";

let isLoading = false;


/* ================= CACHE ================= */

const cache = new Map();

const detailCache = new Map();

const letterCache = new Map();

const categoryCache = new Map();


/* ================= DOM ================= */

const searchForm =
    document.getElementById("searchForm");

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

const loadMoreBtn =
    document.getElementById("loadMoreBtn");

const catalogStatus =
    document.getElementById("catalogStatus");

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

const toastText =
    document.getElementById("toastText");

const heroLoadMore =
    document.getElementById("heroLoadMore");

const checkoutBtn =
    document.getElementById("checkoutBtn");


/* ================= START ================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    bindEvents();

    updateGroup();

    await loadDefaultDrinks();

    loadHeroDrinks();

    loadCollections();

}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

    searchForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            searchDrinks();

        }
    );


    resetFilter.addEventListener(
        "click",
        function() {

            searchInput.value = "";

            loadDefaultDrinks();

        }
    );


    loadMoreBtn.addEventListener(
        "click",
        loadMoreDrinks
    );


    heroLoadMore.addEventListener(
        "click",
        function() {

            document
                .getElementById("drinks")
                .scrollIntoView({
                    behavior: "smooth"
                });

            setTimeout(
                loadMoreDrinks,
                450
            );

        }
    );


    checkoutBtn.addEventListener(
        "click",
        function() {

            if (!selectedDrinks.length) {

                showToast(
                    "Add at least one drink first."
                );

                return;
            }

            showToast(
                `${selectedDrinks.length} drink${
                    selectedDrinks.length > 1
                        ? "s"
                        : ""
                } selected for review.`
            );

        }
    );


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
                event.key === "Escape" &&
                modal.classList.contains("active")
            ) {

                closeModal();

            }

        }
    );

}


/* =========================================================
   API
   ========================================================= */

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


/* =========================================================
   DEFAULT DRINKS
   ========================================================= */

async function loadDefaultDrinks() {

    if (isLoading) return;

    isLoading = true;

    currentMode = "default";

    currentCategory = "all";

    catalogBasics = [];

    catalogIndex = 0;

    setCategoryUI("all");

    showSkeletons(
        INITIAL_LIMIT
    );


    try {

        let basics = [];

        /*
         * Assignment requirement:
         * Initial page shows 10 drinks.
         *
         * First try "A".
         */

        const data =
            await getLetter("a");

        basics =
            uniqueDrinks(
                data
            );


        /*
         * If API gives fewer results,
         * collect more letters.
         */

        if (
            basics.length <
            INITIAL_LIMIT
        ) {

            const extra =
                await getMoreAlphabetBasics(
                    basics
                );

            basics =
                uniqueDrinks(
                    basics.concat(extra)
                );

        }


        catalogBasics =
            basics;


        const firstBatch =
            await enrichDrinks(
                catalogBasics.slice(
                    0,
                    INITIAL_LIMIT
                )
            );


        allDrinks =
            firstBatch;


        catalogIndex =
            Math.min(
                INITIAL_LIMIT,
                catalogBasics.length
            );


        resultText.textContent =
            `Showing ${allDrinks.length} drinks`;


        renderProducts();

        updateCatalogStatus();


    } catch (error) {

        console.error(error);

        showError(
            "Unable to load drinks right now."
        );

    } finally {

        isLoading = false;

    }

}


/* =========================================================
   LETTER COLLECTION
   ========================================================= */

async function getLetter(letter) {

    if (
        letterCache.has(letter)
    ) {

        return letterCache.get(letter);

    }


    try {

        const data =
            await apiRequest(
                `search.php?f=${letter}`
            );


        const drinks =
            uniqueDrinks(
                data.drinks || []
            );


        letterCache.set(
            letter,
            drinks
        );


        return drinks;

    } catch (error) {

        console.error(error);

        return [];

    }

}


/* =========================================================
   MORE ALPHABET DATA
   ========================================================= */

async function getMoreAlphabetBasics(
    existing
) {

    const letters =
        "bcdefghijklmnopqrstuvwxyz"
            .split("");


    const existingIds =
        new Set(
            existing.map(
                drink =>
                    drink.idDrink
            )
        );


    let result = [];


    /*
     * Fetch alphabet endpoints in batches.
     * This creates a much larger catalog
     * without making hundreds of requests.
     */

    for (
        let start = 0;
        start < letters.length;
        start += 5
    ) {

        const batch =
            letters.slice(
                start,
                start + 5
            );


        const responses =
            await Promise.all(
                batch.map(
                    letter =>
                        getLetter(letter)
                )
            );


        responses.forEach(
            function(drinks) {

                drinks.forEach(
                    function(drink) {

                        if (
                            !existingIds.has(
                                drink.idDrink
                            )
                        ) {

                            existingIds.add(
                                drink.idDrink
                            );

                            result.push(
                                drink
                            );

                        }

                    }
                );

            }
        );


        /*
         * Enough for initial 10?
         */

        if (
            existing.length +
            result.length >= 60
        ) {

            break;

        }

    }


    return result;

}


/* =========================================================
   LOAD MORE
   ========================================================= */

async function loadMoreDrinks() {

    if (
        isLoading
    ) {

        return;

    }


    /*
     * If default catalog has not been expanded,
     * collect a large catalog first.
     */

    if (
        currentMode === "default" &&
        catalogBasics.length < 30
    ) {

        isLoading = true;

        setLoadMoreLoading(true);


        try {

            const extra =
                await getMoreAlphabetBasics(
                    catalogBasics
                );


            catalogBasics =
                uniqueDrinks(
                    catalogBasics.concat(
                        extra
                    )
                );

        } catch (error) {

            console.error(error);

        } finally {

            isLoading = false;

            setLoadMoreLoading(false);

        }

    }


    if (
        catalogIndex >=
        catalogBasics.length
    ) {

        if (
            currentMode === "default"
        ) {

            catalogBasics =
                await getMoreAlphabetBasics(
                    catalogBasics
                );

        }

    }


    if (
        catalogIndex >=
        catalogBasics.length
    ) {

        updateCatalogStatus();

        return;

    }


    isLoading = true;

    setLoadMoreLoading(true);


    try {

        const nextBasics =
            catalogBasics.slice(
                catalogIndex,
                catalogIndex + LOAD_BATCH
            );


        const nextDrinks =
            await enrichDrinks(
                nextBasics
            );


        const existingIds =
            new Set(
                allDrinks.map(
                    drink =>
                        drink.idDrink
                )
            );


        const uniqueNext =
            nextDrinks.filter(
                drink =>
                    !existingIds.has(
                        drink.idDrink
                    )
            );


        allDrinks =
            allDrinks.concat(
                uniqueNext
            );


        catalogIndex +=
            nextBasics.length;


        resultText.textContent =
            `Showing ${allDrinks.length} drinks`;


        renderProducts();

        updateCatalogStatus();


    } catch (error) {

        console.error(error);

        showToast(
            "Could not load more drinks."
        );

    } finally {

        isLoading = false;

        setLoadMoreLoading(false);

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

async function searchDrinks() {

    const query =
        searchInput.value.trim();


    if (!query) {

        await loadDefaultDrinks();

        return;

    }


    if (isLoading) return;

    isLoading = true;

    currentMode = "search";

    currentCategory = "all";

    setCategoryUI("all");

    showSkeletons(8);


    try {

        const data =
            await apiRequest(
                "search.php?s=" +
                encodeURIComponent(query)
            );


        const basics =
            uniqueDrinks(
                data.drinks || []
            );


        if (!basics.length) {

            resultText.textContent =
                "0 results";

            drinksContainer.innerHTML = `
                <div class="not-found">
                    <h2>No drinks found</h2>
                    <p>
                        We couldn't find
                        "${escapeHtml(query)}".
                    </p>
                </div>
            `;

            loadMoreBtn.style.display =
                "none";

            catalogStatus.textContent =
                "Try another drink name.";

            return;

        }


        catalogBasics =
            basics;

        catalogIndex =
            basics.length;


        allDrinks =
            await enrichDrinks(
                basics
            );


        resultText.textContent =
            `Found ${allDrinks.length} result${
                allDrinks.length === 1
                    ? ""
                    : "s"
            }`;


        renderProducts();

        updateCatalogStatus();


        document
            .getElementById("drinks")
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error(error);

        showError(
            "Search failed."
        );

    } finally {

        isLoading = false;

    }

}


/* =========================================================
   CATEGORY
   ========================================================= */

async function loadCategory(
    category
) {

    if (isLoading) return;

    if (
        category === "all"
    ) {

        await loadDefaultDrinks();

        return;

    }


    isLoading = true;

    currentMode = "category";

    currentCategory = category;

    catalogBasics = [];

    catalogIndex = 0;

    setCategoryUI(category);

    showSkeletons(8);


    try {

        let basics = [];


        if (
            categoryCache.has(
                category
            )
        ) {

            basics =
                categoryCache.get(
                    category
                );

        } else {

            let endpoint;


            if (
                category ===
                "Non_Alcoholic"
            ) {

                endpoint =
                    "filter.php?a=Non_Alcoholic";

            } else {

                endpoint =
                    "filter.php?c=" +
                    encodeURIComponent(
                        category
                    );

            }


            const data =
                await apiRequest(
                    endpoint
                );


            basics =
                uniqueDrinks(
                    data.drinks || []
                );


            categoryCache.set(
                category,
                basics
            );

        }


        if (!basics.length) {

            drinksContainer.innerHTML = `
                <div class="not-found">
                    <h2>
                        No drinks available
                    </h2>
                </div>
            `;

            return;

        }


        catalogBasics =
            basics;

        catalogIndex =
            Math.min(
                LOAD_BATCH,
                basics.length
            );


        allDrinks =
            await enrichDrinks(
                basics.slice(
                    0,
                    LOAD_BATCH
                )
            );


        resultText.textContent =
            `${allDrinks.length} drinks`;


        renderProducts();

        updateCatalogStatus();


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

    } finally {

        isLoading = false;

    }

}


/* =========================================================
   ENRICH DETAILS
   ========================================================= */

async function enrichDrinks(
    drinks
) {

    const limited =
        drinks.slice(
            0,
            LOAD_BATCH
        );


    const results = [];


    /*
     * Sequential requests reduce
     * API pressure and make the app
     * more reliable than 30 simultaneous
     * lookup requests.
     */

    for (
        const drink of limited
    ) {

        try {

            const detailed =
                await getDrinkDetails(
                    drink.idDrink
                );


            results.push(
                detailed || drink
            );

        } catch {

            results.push(
                drink
            );

        }

    }


    return uniqueDrinks(
        results
    );

}


/* =========================================================
   DETAIL REQUEST
   ========================================================= */

async function getDrinkDetails(
    id
) {

    if (
        detailCache.has(id)
    ) {

        return detailCache.get(id);

    }


    const data =
        await apiRequest(
            "lookup.php?i=" + id
        );


    const drink =
        data.drinks &&
        data.drinks[0];


    if (drink) {

        detailCache.set(
            id,
            drink
        );

    }


    return drink || null;

}


/* =========================================================
   HERO
   ========================================================= */

async function loadHeroDrinks() {

    try {

        const data =
            await getLetter("a");


        if (!data.length) {
            return;
        }


        const heroDrinks =
            data.slice(0, 3);


        setHeroImage(
            "heroDrink1",
            heroDrinks[0]
        );


        setHeroImage(
            "heroDrink2",
            heroDrinks[1]
        );


        setHeroImage(
            "heroDrink3",
            heroDrinks[2]
        );


    } catch (error) {

        console.error(
            "Hero loading failed:",
            error
        );

    }

}


function setHeroImage(
    elementId,
    drink
) {

    if (!drink) {
        return;
    }


    const image =
        document.getElementById(
            elementId
        );


    if (!image) {
        return;
    }


    image.src =
        safeUrl(
            drink.strDrinkThumb
        );


    image.alt =
        drink.strDrink ||
        "Featured drink";

}


/* =========================================================
   CATEGORY UI
   ========================================================= */

function setCategoryUI(
    category
) {

    document
        .querySelectorAll(
            ".category-item"
        )
        .forEach(
            function(button) {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                    category
                );

            }
        );


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


/* =========================================================
   PRODUCTS
   ========================================================= */

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
        function(drink, index) {

            const card =
                createProductCard(
                    drink,
                    index
                );


            drinksContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createProductCard(
    drink,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    card.style.animationDelay =
        `${Math.min(index * 45, 450)}ms`;


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


    const price =
        getPriceData(
            drink
        );


    const alreadyAdded =
        selectedDrinks.some(
            function(item) {

                return (
                    item.id ===
                    drink.idDrink
                );

            }
        );


    const alcoholic =
        drink.strAlcoholic ===
        "Non_Alcoholic"
            ? "NON-ALCOHOLIC"
            : "ALCOHOLIC";


    const imageUrl =
        safeUrl(
            drink.strDrinkThumb
        );


    card.innerHTML = `

        <div class="product-image">

            <img
                src="${imageUrl}"
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
                title="${escapeHtml(
                    instruction
                )}"
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
                    ${formatPrice(
                        price.basePrice
                    )}
                </span>

                <span class="discount">
                    ${price.discount}% OFF
                </span>

                <strong class="final-price">
                    ${formatPrice(
                        price.finalPrice
                    )}
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


    const addButton =
        card.querySelector(
            ".add-btn"
        );


    const detailsButton =
        card.querySelector(
            ".details-btn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function() {

                addToGroup(
                    drink,
                    price
                );

            }
        );

    }


    if (detailsButton) {

        detailsButton.addEventListener(
            "click",
            function() {

                showDetails(
                    drink.idDrink
                );

            }
        );

    }


    return card;

}


/* =========================================================
   ADD TO GROUP
   ========================================================= */

function addToGroup(
    drink,
    price
) {

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

                return (
                    item.id ===
                    drink.idDrink
                );

            }
        );


    if (exists) {

        showToast(
            "This drink is already in your group."
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
        `${drink.strDrink} added to your group.`
    );

}


/* =========================================================
   GROUP UPDATE
   ========================================================= */

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
        `${(
            count / MAX_GROUP
        ) * 100}%`;


    calculateTotals();


    drinkCount.classList.remove(
        "bump"
    );


    void drinkCount.offsetWidth;


    drinkCount.classList.add(
        "bump"
    );


    renderSelectedDrinks();

}


/* =========================================================
   SELECTED LIST
   ========================================================= */

function renderSelectedDrinks() {

    selectedDrinksList.innerHTML = "";


    if (!selectedDrinks.length) {

        selectedDrinksList.innerHTML = `

            <li class="empty-group">

                <strong>
                    Your group is empty
                </strong>

                Add drinks from the
                collection to see them here.

            </li>
        `;

        return;

    }


    selectedDrinks.forEach(
        function(item, index) {

            const li =
                document.createElement(
                    "li"
                );


            li.className =
                "selected-drink";


            li.innerHTML = `

                <div
                    class="selected-drink-info"
                >

                    <span
                        class="selected-drink-name"
                    >
                        ${index + 1}.
                        ${escapeHtml(
                            item.name
                        )}
                    </span>

                    <span
                        class="selected-drink-price"
                    >
                        ${formatPrice(
                            item.price.finalPrice
                        )}
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


            li.querySelector(
                ".remove"
            ).addEventListener(
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
                li
            );

        }
    );

}


/* =========================================================
   TOTALS
   ========================================================= */

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


/* =========================================================
   PRICE
   ========================================================= */

function getPriceData(
    drink
) {

    const id =
        parseInt(
            drink.idDrink,
            10
        ) || 100;


    /*
     * Dollar pricing for marketplace UI.
     */

    const basePrice =
        6 +
        (id % 11) * 3;


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
            Math.round(
                basePrice
            ),

        discount,

        discountAmount:
            Math.round(
                discountAmount
            ),

        finalPrice:
            Math.round(
                finalPrice
            )

    };

}


function formatPrice(
    price
) {

    return "$" +
        Number(
            price || 0
        ).toLocaleString(
            "en-US"
        );

}


/* =========================================================
   COLLECTIONS
   ========================================================= */

async function loadCollections() {

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

            const basics =
                await getCategoryBasics(
                    collection.category
                );


            const drinks =
                await enrichDrinks(
                    basics.slice(0, 5)
                );


            renderCollection(
                collection.element,
                drinks
            );


        } catch (error) {

            console.error(
                "Collection error:",
                error
            );

        }

    }

}


/* =========================================================
   CATEGORY BASIC DATA
   ========================================================= */

async function getCategoryBasics(
    category
) {

    if (
        categoryCache.has(
            category
        )
    ) {

        return categoryCache.get(
            category
        );

    }


    let endpoint;


    if (
        category ===
        "Non_Alcoholic"
    ) {

        endpoint =
            "filter.php?a=Non_Alcoholic";

    } else {

        endpoint =
            "filter.php?c=" +
            encodeURIComponent(
                category
            );

    }


    const data =
        await apiRequest(
            endpoint
        );


    const drinks =
        uniqueDrinks(
            data.drinks || []
        );


    categoryCache.set(
        category,
        drinks
    );


    return drinks;

}


/* =========================================================
   COLLECTION RENDER
   ========================================================= */

function renderCollection(
    elementId,
    drinks
) {

    const section =
        document.getElementById(
            elementId
        );


    if (!section) return;


    const grid =
        section.querySelector(
            ".collection-grid"
        );


    if (!grid) return;


    grid.innerHTML = "";


    drinks.forEach(
        function(drink) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "collection-card";


            const image =
                safeUrl(
                    drink.strDrinkThumb
                );


            card.innerHTML = `

                <img
                    src="${image}"
                    alt="${escapeHtml(
                        drink.strDrink
                    )}"
                    loading="lazy"
                >

                <div
                    class="collection-card-body"
                >

                    <strong>
                        ${escapeHtml(
                            drink.strDrink
                        )}
                    </strong>

                    <span>
                        ${
                            escapeHtml(
                                drink.strCategory ||
                                "Premium Drink"
                            )
                        }
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


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   DETAILS MODAL
   ========================================================= */

async function showDetails(
    id
) {

    modal.classList.add(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";


    modalBody.innerHTML = `

        <div class="skeleton-body">

            <div class="skeleton-line medium"></div>

            <div class="skeleton-line"></div>

            <div class="skeleton-line short"></div>

            <div class="skeleton-line"></div>

            <div class="skeleton-line"></div>

        </div>
    `;


    try {

        const drink =
            await getDrinkDetails(
                id
            );


        if (!drink) {

            modalBody.innerHTML = `
                <div class="not-found">
                    <h2>
                        Details unavailable
                    </h2>
                </div>
            `;

            return;

        }


        renderModal(
            drink
        );


    } catch (error) {

        console.error(error);

        modalBody.innerHTML = `
            <div class="not-found">
                <h2>
                    Unable to load details
                </h2>
            </div>
        `;

    }

}


/* =========================================================
   MODAL CONTENT
   ========================================================= */

function renderModal(
    drink
) {

    const ingredients =
        getIngredients(
            drink
        );


    const image =
        safeUrl(
            drink.strDrinkThumb
        );


    const price =
        getPriceData(
            drink
        );


    const glass =
        drink.strGlass ||
        "Not specified";


    const category =
        drink.strCategory ||
        "Drink";


    const alcoholic =
        drink.strAlcoholic ||
        "Not specified";


    const instructions =
        drink.strInstructions ||
        "No instructions available.";


    modalBody.innerHTML = `

        <div class="modal-content">

            <div class="modal-image">

                <img
                    src="${image}"
                    alt="${escapeHtml(
                        drink.strDrink
                    )}"
                >

            </div>


            <div class="modal-info">

                <span class="eyebrow">
                    DRINK DETAILS
                </span>

                <h2 id="modalTitle">
                    ${escapeHtml(
                        drink.strDrink
                    )}
                </h2>

                <p class="modal-subtitle">
                    Discover ingredients,
                    category, glass and
                    preparation instructions.
                </p>


                <div class="modal-tags">

                    <span class="modal-tag">
                        ${escapeHtml(
                            category
                        )}
                    </span>

                    <span class="modal-tag">
                        ${escapeHtml(
                            alcoholic
                        )}
                    </span>

                    <span class="modal-tag">
                        ${formatPrice(
                            price.finalPrice
                        )}
                    </span>

                </div>


                <div class="info-grid">

                    <div class="info-box">

                        <span>
                            Category
                        </span>

                        <strong>
                            ${escapeHtml(
                                category
                            )}
                        </strong>

                    </div>


                    <div class="info-box">

                        <span>
                            Alcohol
                        </span>

                        <strong>
                            ${escapeHtml(
                                alcoholic
                            )}
                        </strong>

                    </div>


                    <div class="info-box">

                        <span>
                            Glass
                        </span>

                        <strong>
                            ${escapeHtml(
                                glass
                            )}
                        </strong>

                    </div>


                    <div class="info-box">

                        <span>
                            Price
                        </span>

                        <strong>
                            ${formatPrice(
                                price.finalPrice
                            )}
                        </strong>

                    </div>

                </div>


                <div class="modal-section">

                    <h4>
                        Ingredients
                    </h4>

                    <div class="ingredients">

                        ${
                            ingredients.length
                                ? ingredients
                                    .map(
                                        ingredient =>
                                            `
                                            <span
                                                class="ingredient"
                                            >
                                                ${escapeHtml(
                                                    ingredient
                                                )}
                                            </span>
                                            `
                                    )
                                    .join("")
                                : `
                                    <span
                                        class="ingredient"
                                    >
                                        Not specified
                                    </span>
                                `
                        }

                    </div>

                </div>


                <div class="modal-section">

                    <h4>
                        Instructions
                    </h4>

                    <p>
                        ${escapeHtml(
                            instructions
                        )}
                    </p>

                </div>

            </div>

        </div>
    `;

}


/* =========================================================
   INGREDIENTS
   ========================================================= */

function getIngredients(
    drink
) {

    const ingredients = [];


    for (
        let i = 1;
        i <= 15;
        i++
    ) {

        const ingredient =
            drink[
                `strIngredient${i}`
            ];


        const measure =
            drink[
                `strMeasure${i}`
            ];


        if (
            ingredient &&
            ingredient.trim()
        ) {

            const value =
                measure &&
                measure.trim()
                    ? `${measure.trim()} ${ingredient.trim()}`
                    : ingredient.trim();


            ingredients.push(
                value
            );

        }

    }


    return ingredients;

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    modal.classList.remove(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}


/* =========================================================
   LOADING
   ========================================================= */

function showSkeletons(
    count
) {

    drinksContainer.innerHTML = "";


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const skeleton =
            document.createElement(
                "div"
            );


        skeleton.className =
            "skeleton-card";


        skeleton.innerHTML = `

            <div class="skeleton-image"></div>

            <div class="skeleton-body">

                <div class="skeleton-line medium"></div>

                <div class="skeleton-line short"></div>

                <div class="skeleton-line"></div>

                <div class="skeleton-line medium"></div>

            </div>
        `;


        drinksContainer.appendChild(
            skeleton
        );

    }

}


/* =========================================================
   LOAD BUTTON
   ========================================================= */

function setLoadMoreLoading(
    loading
) {

    if (loading) {

        loadMoreBtn.classList.add(
            "loading"
        );

        loadMoreBtn.querySelector(
            "span"
        ).textContent =
            "Loading drinks...";

    } else {

        loadMoreBtn.classList.remove(
            "loading"
        );

        loadMoreBtn.querySelector(
            "span"
        ).textContent =
            "Load More Drinks";

    }

}


/* =========================================================
   CATALOG STATUS
   ========================================================= */

function updateCatalogStatus() {

    const available =
        catalogBasics.length;


    if (
        currentMode === "search"
    ) {

        loadMoreBtn.style.display =
            "none";

        catalogStatus.textContent =
            "Search results";

        return;

    }


    if (
        catalogIndex <
        available
    ) {

        loadMoreBtn.style.display =
            "inline-flex";

        catalogStatus.textContent =
            `${available - catalogIndex} more drinks available`;

    } else {

        loadMoreBtn.style.display =
            "inline-flex";

        catalogStatus.textContent =
            "Explore more drinks with Load More";

    }

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
    message
) {

    drinksContainer.innerHTML = `

        <div class="not-found">

            <h2>
                Something went wrong
            </h2>

            <p>
                ${escapeHtml(
                    message
                )}
            </p>

        </div>
    `;


    resultText.textContent =
        "Unable to load drinks";


    loadMoreBtn.style.display =
        "none";

}


/* =========================================================
   HELPERS
   ========================================================= */

function uniqueDrinks(
    drinks
) {

    const seen =
        new Set();


    return drinks.filter(
        function(drink) {

            if (
                !drink ||
                !drink.idDrink
            ) {

                return false;

            }


            if (
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


function getCategoryLabel(
    category
) {

    const names = {

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


    return (
        names[category] ||
        "Drink"
    );

}


/*
 * IMPORTANT:
 * Correct regex.
 * Previous version had a broken regex
 * which stopped the entire JS file.
 */

function safeUrl(
    url
) {

    return /^https?:\/\//i.test(
        url || ""
    )
        ? url
        : "";

}


/*
 * Total displayed length will never
 * exceed max.
 *
 * Example:
 * max = 15
 * "This is a very..." -> max 15 chars
 */

function truncate(
    text,
    max
) {

    text =
        String(
            text || ""
        );


    if (
        text.length <= max
    ) {

        return text;

    }


    if (max <= 3) {

        return text.slice(
            0,
            max
        );

    }


    return (
        text.slice(
            0,
            max - 3
        ) +
        "..."
    );

}


function escapeHtml(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(
    message
) {

    toastText.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2600
        );

}