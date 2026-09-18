/* =========================================================
   DRINKLY APPLICATION
   ========================================================= */


/* ================= API ================= */

const API =
    "https://www.thecocktaildb.com/api/json/v1/1/";

const MAX_GROUP = 7;


/* ================= STATE ================= */

let selectedDrinks = [];

let allDrinks = [];

let currentFilter = "all";

const cache = new Map();

const usedCollectionDrinks =
    new Set();


/* ================= ELEMENTS ================= */

const container =
    document.getElementById(
        "drinksContainer"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchBtn =
    document.getElementById(
        "searchBtn"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const resultText =
    document.getElementById(
        "resultText"
    );

const selectedList =
    document.getElementById(
        "selectedDrinks"
    );

const drinkCount =
    document.getElementById(
        "drinkCount"
    );

const currentCount =
    document.getElementById(
        "currentCount"
    );

const navCount =
    document.getElementById(
        "navCount"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const modal =
    document.getElementById(
        "detailsModal"
    );

const modalBody =
    document.getElementById(
        "modalBody"
    );

const closeModalBtn =
    document.getElementById(
        "closeModal"
    );

const toast =
    document.getElementById(
        "toast"
    );

const backTop =
    document.getElementById(
        "backTop"
    );


/* ================= INIT ================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    await loadDefaultDrinks();

    await buildCollections();

    updateGroup();

}


/* ================= SEARCH ================= */

searchBtn.addEventListener(
    "click",
    searchDrinks
);


searchInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchDrinks();

        }

    }
);


clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        currentFilter = "all";

        setActiveFilter(
            "all"
        );

        loadDefaultDrinks();

    }
);


/* ================= FILTER ================= */

document
    .querySelectorAll(
        ".filter"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    currentFilter =
                        button.dataset.filter;

                    setActiveFilter(
                        currentFilter
                    );

                    renderDrinks();

                }
            );

        }
    );


function setActiveFilter(
    filter
) {

    document
        .querySelectorAll(
            ".filter"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.filter ===
                    filter
                );

            }
        );

}


/* ================= SEE MORE ================= */

document
    .querySelectorAll(
        ".see-more"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const grid =
                        document.getElementById(
                            button.dataset.target
                        );


                    const expanded =
                        grid.classList.toggle(
                            "expanded"
                        );


                    button.classList.toggle(
                        "open",
                        expanded
                    );


                    button.innerHTML =
                        expanded
                            ? "Show Less <span>−</span>"
                            : "See More <span>+</span>";

                }
            );

        }
    );


/* ================= API FUNCTION ================= */

async function getData(
    endpoint
) {

    if (
        cache.has(endpoint)
    ) {

        return cache.get(
            endpoint
        );

    }


    const response =
        await fetch(
            API + endpoint
        );


    if (
        !response.ok
    ) {

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


/* ================= DEFAULT 10 ================= */

async function loadDefaultDrinks() {

    showLoading();


    try {

        /*
         * Assignment requirement:
         * Initial page must show 10 drinks.
         */

        const data =
            await getData(
                "search.php?f=a"
            );


        allDrinks =
            uniqueDrinks(
                data.drinks || []
            ).slice(
                0,
                10
            );


        currentFilter =
            "all";


        setActiveFilter(
            "all"
        );


        resultText.textContent =
            `Showing ${allDrinks.length} drinks`;


        renderDrinks();


    } catch (error) {

        showError(
            "Unable to load drinks. Please try again."
        );

        console.error(
            error
        );

    }

}


/* ================= SEARCH DRINKS ================= */

async function searchDrinks() {

    const query =
        searchInput.value.trim();


    if (!query) {

        loadDefaultDrinks();

        return;

    }


    showLoading();


    try {

        const data =
            await getData(
                "search.php?s=" +
                encodeURIComponent(
                    query
                )
            );


        allDrinks =
            uniqueDrinks(
                data.drinks || []
            );


        currentFilter =
            "all";


        setActiveFilter(
            "all"
        );


        if (
            allDrinks.length === 0
        ) {

            resultText.textContent =
                "0 results";


            container.innerHTML = `

                <div class="not-found">

                    <h2>
                        No drinks found
                    </h2>

                    <p style="margin-top:8px">

                        No drink matched
                        "${escapeHtml(query)}".

                    </p>

                </div>

            `;

            return;

        }


        resultText.textContent =
            `Found ${allDrinks.length} result${
                allDrinks.length === 1
                    ? ""
                    : "s"
            }`;


        renderDrinks();


        document
            .getElementById(
                "drinks"
            )
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        showError(
            "Search failed. Please try again."
        );

        console.error(
            error
        );

    }

}


/* ================= RENDER DRINKS ================= */

function renderDrinks() {

    let drinks =
        allDrinks;


    if (
        currentFilter !== "all"
    ) {

        drinks =
            allDrinks.filter(
                function (drink) {

                    return (
                        drink.strAlcoholic ===
                        currentFilter
                    );

                }
            );

    }


    if (
        drinks.length === 0
    ) {

        container.innerHTML = `

            <div class="not-found">

                <h2>
                    Nothing here yet
                </h2>

                <p style="margin-top:8px">

                    Try another filter.

                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        "";


    drinks.forEach(
        function (drink) {

            container.appendChild(
                createDrinkCard(
                    drink
                )
            );

        }
    );

}


/* ================= CARD ================= */

function createDrinkCard(
    drink
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "drink-card";


    const isNonAlcoholic =
        drink.strAlcoholic ===
        "Non_Alcoholic";


    const instructions =
        truncate(
            drink.strInstructions ||
            "No instructions available",
            15
        );


    card.innerHTML = `

        <div class="drink-image">

            <img
                src="${safeUrl(
                    drink.strDrinkThumb
                )}"
                alt="${escapeHtml(
                    drink.strDrink
                )}"
                loading="lazy"
            >

            <span class="type-badge">

                ${
                    isNonAlcoholic
                        ? "NON-ALCOHOLIC"
                        : "ALCOHOLIC"
                }

            </span>

        </div>


        <div class="drink-content">

            <h3>

                ${escapeHtml(
                    drink.strDrink
                )}

            </h3>


            <span class="category">

                ${escapeHtml(
                    drink.strCategory ||
                    "Unknown"
                )}

            </span>


            <p
                class="instructions"
                title="${escapeHtml(
                    drink.strInstructions ||
                    ""
                )}"
            >

                ${escapeHtml(
                    instructions
                )}

            </p>


            <div class="card-actions">

                <button
                    class="card-button add-button"
                    type="button"
                >
                    Add to Group
                </button>


                <button
                    class="card-button details-button"
                    type="button"
                >
                    Details
                </button>

            </div>

        </div>

    `;


    const addButton =
        card.querySelector(
            ".add-button"
        );


    if (
        selectedDrinks.includes(
            drink.strDrink
        )
    ) {

        addButton.textContent =
            "Added";

        addButton.disabled =
            true;

    }


    addButton.addEventListener(
        "click",
        function () {

            addToGroup(
                drink.strDrink
            );

        }
    );


    card
        .querySelector(
            ".details-button"
        )
        .addEventListener(
            "click",
            function () {

                showDetails(
                    drink.idDrink
                );

            }
        );


    return card;

}


/* ================= ADD TO GROUP ================= */

function addToGroup(
    name
) {

    /*
     * Assignment requirement:
     * Maximum 7.
     */

    if (
        selectedDrinks.length >=
        MAX_GROUP
    ) {

        alert(
            "You cannot add more than 7 drinks to the group!"
        );

        return;

    }


    if (
        selectedDrinks.includes(
            name
        )
    ) {

        alert(
            "This drink is already in your group!"
        );

        return;

    }


    selectedDrinks.push(
        name
    );


    updateGroup();


    renderDrinks();


    showToast(
        "Drink added to your group."
    );

}


/* ================= UPDATE GROUP ================= */

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


    if (
        count === 0
    ) {

        selectedList.innerHTML = `

            <li class="empty">

                Your selected drinks
                will appear here.

            </li>

        `;

        return;

    }


    selectedList.innerHTML =
        "";


    selectedDrinks.forEach(
        function (
            name,
            index
        ) {

            const item =
                document.createElement(
                    "li"
                );


            item.innerHTML = `

                <span>

                    ${index + 1}.
                    ${escapeHtml(name)}

                </span>


                <button
                    class="remove"
                    type="button"
                    aria-label="Remove drink"
                >
                    ×
                </button>

            `;


            item
                .querySelector(
                    ".remove"
                )
                .addEventListener(
                    "click",
                    function () {

                        selectedDrinks.splice(
                            index,
                            1
                        );


                        updateGroup();


                        renderDrinks();


                        showToast(
                            "Drink removed."
                        );

                    }
                );


            selectedList.appendChild(
                item
            );

        }
    );

}


/* ================= DETAILS ================= */

async function showDetails(
    id
) {

    modal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";


    modalBody.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            <p>
                Loading details...
            </p>

        </div>

    `;


    try {

        const data =
            await getData(
                "lookup.php?i=" +
                encodeURIComponent(
                    id
                )
            );


        const drink =
            data.drinks &&
            data.drinks[0];


        if (!drink) {

            throw new Error(
                "Drink unavailable"
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
                    "strIngredient" +
                    i
                ];


            const measure =
                drink[
                    "strMeasure" +
                    i
                ];


            if (
                ingredient
            ) {

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


        modalBody.innerHTML = `

            <img
                class="modal-img"
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


            <div class="info-grid">

                <div class="info">

                    <strong>
                        Category
                    </strong>

                    ${escapeHtml(
                        drink.strCategory ||
                        "N/A"
                    )}

                </div>


                <div class="info">

                    <strong>
                        Type
                    </strong>

                    ${escapeHtml(
                        drink.strAlcoholic ||
                        "N/A"
                    )}

                </div>


                <div class="info">

                    <strong>
                        Glass
                    </strong>

                    ${escapeHtml(
                        drink.strGlass ||
                        "N/A"
                    )}

                </div>


                <div class="info">

                    <strong>
                        IBA
                    </strong>

                    ${escapeHtml(
                        drink.strIBA ||
                        "N/A"
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


    } catch (error) {

        modalBody.innerHTML = `

            <div class="not-found">

                <h2>
                    Details unavailable
                </h2>

                <p style="margin-top:8px">

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
    function (event) {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

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


/* ================= COLLECTION BUILDER ================= */

async function buildCollections() {

    /*
     * Different API categories/letters are collected.
     * Every drink gets checked against one global Set,
     * so the same drink is not intentionally reused.
     */

    try {

        const [
            classics,
            tropical,
            refreshing,
            zeroProof,
            warm
        ] = await Promise.all([

            getCategoryDrinks(
                "Cocktail"
            ),

            getCategoryDrinks(
                "Punch / Party Drink"
            ),

            getCategoryDrinks(
                "Ordinary Drink"
            ),

            getNonAlcoholicDrinks(),

            getWarmDrinks()

        ]);


        renderUniqueCollection(
            "classicGrid",
            classics
        );


        renderUniqueCollection(
            "tropicalGrid",
            tropical
        );


        renderUniqueCollection(
            "freshGrid",
            refreshing
        );


        renderUniqueCollection(
            "zeroGrid",
            zeroProof
        );


        renderUniqueCollection(
            "warmGrid",
            warm
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


/* ================= CATEGORY API ================= */

async function getCategoryDrinks(
    category
) {

    try {

        const data =
            await getData(
                "filter.php?c=" +
                encodeURIComponent(
                    category
                )
            );


        return data.drinks || [];

    } catch {

        return [];

    }

}


/* ================= NON ALCOHOLIC ================= */

async function getNonAlcoholicDrinks() {

    try {

        const data =
            await getData(
                "filter.php?a=Non_Alcoholic"
            );


        return data.drinks || [];

    } catch {

        return [];

    }

}


/* ================= WARM DRINKS ================= */

async function getWarmDrinks() {

    try {

        const coffee =
            await getData(
                "filter.php?c=Coffee / Tea"
            );


        const cocoa =
            await getData(
                "search.php?s=chocolate"
            );


        return uniqueDrinks(
            [
                ...(coffee.drinks || []),
                ...(cocoa.drinks || [])
            ]
        );

    } catch {

        return [];

    }

}


/* ================= UNIQUE COLLECTION ================= */

function renderUniqueCollection(
    elementId,
    drinks
) {

    const grid =
        document.getElementById(
            elementId
        );


    grid.innerHTML =
        "";


    const unique =
        [];


    for (
        const drink of drinks
    ) {

        if (
            usedCollectionDrinks.has(
                drink.idDrink
            )
        ) {

            continue;

        }


        usedCollectionDrinks.add(
            drink.idDrink
        );


        unique.push(
            drink
        );


        if (
            unique.length >= 10
        ) {

            break;

        }

    }


    unique.forEach(
        function (drink) {

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


                <div class="collection-info">

                    <strong>

                        ${escapeHtml(
                            drink.strDrink
                        )}

                    </strong>


                    <span>

                        ${escapeHtml(
                            drink.strCategory ||
                            "Drink"
                        )}

                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                function () {

                    showDetails(
                        drink.idDrink
                    );

                }
            );


            card.style.cursor =
                "pointer";


            grid.appendChild(
                card
            );

        }
    );

}


/* ================= UNIQUE DRINKS ================= */

function uniqueDrinks(
    drinks
) {

    const seen =
        new Set();


    return drinks.filter(
        function (drink) {

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


/* ================= LOADING ================= */

function showLoading() {

    container.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            <p>
                Loading drinks...
            </p>

        </div>

    `;

}


/* ================= ERROR ================= */

function showError(
    message
) {

    container.innerHTML = `

        <div class="not-found">

            <h2>
                Something went wrong
            </h2>

            <p style="margin-top:8px">

                ${escapeHtml(message)}

            </p>

        </div>

    `;

}


/* ================= TOAST ================= */

function showToast(
    message
) {

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
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2000
        );

}


/* ================= BACK TOP ================= */

window.addEventListener(
    "scroll",
    function () {

        backTop.classList.toggle(
            "show",
            window.scrollY > 450
        );

    }
);


backTop.addEventListener(
    "click",
    function () {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* ================= HELPERS ================= */

function truncate(
    text,
    max
) {

    return text.length > max
        ? text.slice(0, max) + "..."
        : text;

}


function safeUrl(
    url
) {

    return /^https?:\/\//i.test(
        url || ""
    )
        ? url
        : "";

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        function (character) {

            return {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#039;"

            }[character];

        }
    );

}