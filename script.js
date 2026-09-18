const API =
    "https://www.thecocktaildb.com/api/json/v1/1/";

const MAX_GROUP = 7;


/* ================= STATE ================= */

let selectedDrinks = [];

let allDrinks = [];

let visibleDrinks = [];

let currentFilter = "all";

const cache = new Map();


/* ================= ELEMENTS ================= */

const $ = id =>
    document.getElementById(id);


const container =
    $("drinksContainer");

const searchInput =
    $("searchInput");

const searchBtn =
    $("searchBtn");

const clearSearch =
    $("clearSearch");

const resultText =
    $("resultText");

const selectedList =
    $("selectedDrinks");

const countEl =
    $("drinkCount");

const currentCount =
    $("currentCount");

const navCount =
    $("navCount");

const progressBar =
    $("progressBar");

const modal =
    $("detailsModal");

const modalBody =
    $("modalBody");

const closeModalBtn =
    $("closeModal");

const toast =
    $("toast");

const backTop =
    $("backTop");


/* ================= INITIALIZE ================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    await loadDefaultDrinks();

    await buildCollections();

    updateGroup();

}


/* ================= SEARCH EVENTS ================= */

searchBtn.addEventListener(
    "click",
    searchDrinks
);


searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            searchDrinks();

        }

    }
);


clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        currentFilter = "all";

        setActiveFilter("all");

        loadDefaultDrinks();

    }
);


/* ================= MODAL EVENTS ================= */

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


/* ================= BACK TO TOP ================= */

window.addEventListener(
    "scroll",
    function () {

        backTop.classList.toggle(
            "show",
            window.scrollY > 500
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


/* ================= FILTERS ================= */

document
    .querySelectorAll(".filter")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                currentFilter =
                    button.dataset.filter;

                setActiveFilter(
                    currentFilter
                );

                renderMain();

            }
        );

    });


function setActiveFilter(filter) {

    document
        .querySelectorAll(".filter")
        .forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.filter === filter
            );

        });

}


/* ================= SEE MORE ================= */

document
    .querySelectorAll(".see-more")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const grid =
                    $(button.dataset.target);

                const expanded =
                    grid.classList.toggle(
                        "expanded"
                    );


                if (expanded) {

                    button.innerHTML =
                        'Show Less <span>↑</span>';

                    button.classList.add(
                        "open"
                    );

                } else {

                    button.innerHTML =
                        'See More <span>↓</span>';

                    button.classList.remove(
                        "open"
                    );

                }

            }
        );

    });


/* ================= API ================= */

async function api(endpoint) {

    if (
        cache.has(endpoint)
    ) {

        return cache.get(endpoint);

    }


    const response =
        await fetch(
            API + endpoint
        );


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


/* ================= DEFAULT DRINKS ================= */

async function loadDefaultDrinks() {

    showLoading();


    try {

        const data =
            await api(
                "search.php?f=a"
            );


        /*
         * Assignment requirement:
         * Initial load must show 10 drinks.
         */

        allDrinks =
            unique(
                data.drinks || []
            ).slice(0, 10);


        visibleDrinks =
            allDrinks;


        currentFilter =
            "all";


        setActiveFilter("all");


        resultText.textContent =
            `Showing ${allDrinks.length} drinks`;


        renderMain();


    } catch (error) {

        showError(
            "Unable to load drinks. Please check your internet connection and try again."
        );

        console.error(error);

    }

}


/* ================= SEARCH ================= */

async function searchDrinks() {

    const value =
        searchInput.value.trim();


    if (!value) {

        loadDefaultDrinks();

        return;

    }


    showLoading();


    try {

        const data =
            await api(
                "search.php?s=" +
                encodeURIComponent(value)
            );


        allDrinks =
            unique(
                data.drinks || []
            );


        currentFilter =
            "all";


        setActiveFilter("all");


        if (
            !allDrinks.length
        ) {

            resultText.textContent =
                "0 results";


            container.innerHTML = `

                <div class="not-found">

                    <h2>
                        No drinks found
                    </h2>

                    <p style="margin-top:8px">

                        We couldn't find a drink
                        matching
                        "${escapeHtml(value)}".

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


        renderMain();


        $("drinks").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        showError(
            "Search failed. Please try again."
        );

        console.error(error);

    }

}


/* ================= MAIN RENDER ================= */

function renderMain() {

    visibleDrinks =
        currentFilter === "all"
            ? allDrinks
            : allDrinks.filter(
                function (drink) {

                    return (
                        drink.strAlcoholic ===
                        currentFilter
                    );

                }
            );


    if (
        !visibleDrinks.length
    ) {

        container.innerHTML = `

            <div class="not-found">

                <h2>
                    No drinks in this filter
                </h2>

                <p style="margin-top:8px">

                    Try another filter
                    or search for a different drink.

                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    visibleDrinks.forEach(
        function (drink) {

            container.appendChild(
                createDrinkCard(drink)
            );

        }
    );

}


/* ================= CREATE CARD ================= */

function createDrinkCard(drink) {

    const card =
        document.createElement("article");


    card.className =
        "drink-card";


    const status =
        drink.strAlcoholic ===
        "Non_Alcoholic"

            ? "NON-ALCOHOLIC"

            : "ALCOHOLIC";


    const instructions =
        truncate(
            drink.strInstructions ||
            "No instructions available",
            15
        );


    card.innerHTML = `

        <div class="drink-img-wrap">

            <img
                class="drink-img"
                src="${safeUrl(
                    drink.strDrinkThumb
                )}"
                alt="${escapeHtml(
                    drink.strDrink
                )}"
                loading="lazy"
            >

            <span class="status-badge">

                ${status}

            </span>

        </div>


        <div class="drink-body">

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


            <div class="actions">

                <button
                    class="btn add"
                    type="button"
                >
                    Add to Group
                </button>


                <button
                    class="btn details"
                    type="button"
                >
                    Details
                </button>

            </div>

        </div>

    `;


    const addBtn =
        card.querySelector(".add");


    if (
        selectedDrinks.includes(
            drink.strDrink
        )
    ) {

        addBtn.textContent =
            "Added";

        addBtn.disabled =
            true;

        addBtn.style.opacity =
            "0.65";

    }


    addBtn.addEventListener(
        "click",
        function () {

            addToGroup(
                drink.strDrink
            );

        }
    );


    card
        .querySelector(".details")
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


/* ================= ADD GROUP ================= */

function addToGroup(name) {

    /*
     * Assignment requirement:
     * Maximum 7 drinks.
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
        selectedDrinks.includes(name)
    ) {

        alert(
            "This drink is already in your group!"
        );

        return;

    }


    selectedDrinks.push(name);


    updateGroup();


    renderMain();


    showToast(
        "Drink added to your group."
    );

}


/* ================= UPDATE GROUP ================= */

function updateGroup() {

    const count =
        selectedDrinks.length;


    countEl.textContent =
        count;


    currentCount.textContent =
        count;


    navCount.textContent =
        count;


    progressBar.style.width =
        `${count / MAX_GROUP * 100}%`;


    if (!count) {

        selectedList.innerHTML = `

            <li class="empty-state">

                Your selected drinks
                will appear here.

            </li>

        `;

        return;

    }


    selectedList.innerHTML =
        "";


    selectedDrinks.forEach(
        function (name, index) {

            const li =
                document.createElement("li");


            li.innerHTML = `

                <span>

                    ${index + 1}.
                    ${escapeHtml(name)}

                </span>


                <button
                    class="remove"
                    type="button"
                    aria-label="Remove ${escapeHtml(name)}"
                >

                    ×

                </button>

            `;


            li
                .querySelector(".remove")
                .addEventListener(
                    "click",
                    function () {

                        selectedDrinks.splice(
                            index,
                            1
                        );


                        updateGroup();


                        renderMain();


                        showToast(
                            "Drink removed from your group."
                        );

                    }
                );


            selectedList.appendChild(
                li
            );

        }
    );

}


/* ================= DETAILS MODAL ================= */

async function showDetails(id) {

    modal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";


    modalBody.innerHTML = `

        <div class="loading-state">

            <span class="spinner"></span>

            <p>
                Loading details...
            </p>

        </div>

    `;


    try {

        const data =
            await api(
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
                    "strIngredient" +
                    i
                ];


            const measure =
                drink[
                    "strMeasure" +
                    i
                ];


            if (ingredient) {

                ingredients.push(`

                    <div class="ingredient">

                        ${escapeHtml(
                            (measure || "")
                                .trim()
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


            <h2 id="modalTitle">

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

                    We couldn't load this
                    drink's details.

                </p>

            </div>

        `;

    }

}


/* ================= CLOSE MODAL ================= */

function closeModal() {

    modal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


/* ================= COLLECTIONS ================= */

async function buildCollections() {

    const letters = [
        "a",
        "b",
        "c",
        "d",
        "e"
    ];


    try {

        const results =
            await Promise.all(
                letters.map(
                    function (letter) {

                        return api(
                            "search.php?f=" +
                            letter
                        );

                    }
                )
            );


        const pool =
            unique(
                results.flatMap(
                    function (result) {

                        return (
                            result.drinks ||
                            []
                        );

                    }
                )
            );


        const classics =
            pool.filter(
                function (drink) {

                    return [
                        "Cocktail",
                        "Ordinary Drink",
                        "Punch / Party Drink"
                    ].includes(
                        drink.strCategory
                    );

                }
            );


        const nonAlcoholic =
            pool.filter(
                function (drink) {

                    return (
                        drink.strAlcoholic ===
                        "Non_Alcoholic"
                    );

                }
            );


        const cocktails =
            pool.filter(
                function (drink) {

                    return (
                        drink.strAlcoholic ===
                        "Alcoholic"
                    );

                }
            );


        const featured =
            pool.filter(
                function (drink) {

                    return (
                        drink.strDrink &&
                        !/shot|beer|coffee/i.test(
                            drink.strDrink
                        )
                    );

                }
            );


        const used =
            new Set(
                featured
                    .slice(0, 10)
                    .map(
                        drink =>
                            drink.idDrink
                    )
            );


        const discover =
            pool.filter(
                function (drink) {

                    return !used.has(
                        drink.idDrink
                    );

                }
            );


        renderMiniCollection(
            "featuredGrid",
            featured.slice(0, 12)
        );


        renderMiniCollection(
            "classicsGrid",
            classics.length
                ? classics.slice(0, 12)
                : pool.slice(5, 17)
        );


        renderMiniCollection(
            "freshGrid",
            nonAlcoholic.length
                ? nonAlcoholic.slice(0, 12)
                : pool.slice(10, 22)
        );


        renderMiniCollection(
            "cocktailGrid",
            cocktails.length
                ? cocktails.slice(0, 12)
                : pool.slice(15, 27)
        );


        renderMiniCollection(
            "discoverGrid",
            discover.slice(0, 12)
        );


    } catch (error) {

        [
            "featuredGrid",
            "classicsGrid",
            "freshGrid",
            "cocktailGrid",
            "discoverGrid"

        ].forEach(
            function (id) {

                $(id).innerHTML = `

                    <div class="not-found">

                        <p>
                            Collection unavailable
                            right now.
                        </p>

                    </div>

                `;

            }
        );

    }

}


/* ================= MINI CARDS ================= */

function renderMiniCollection(
    id,
    drinks
) {

    const grid =
        $(id);


    grid.innerHTML =
        "";


    unique(drinks)
        .forEach(
            function (drink) {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "mini-card";


                item.innerHTML = `

                    <img
                        src="${safeUrl(
                            drink.strDrinkThumb
                        )}"
                        alt="${escapeHtml(
                            drink.strDrink
                        )}"
                        loading="lazy"
                    >


                    <div class="mini-body">

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


                item.addEventListener(
                    "click",
                    function () {

                        showDetails(
                            drink.idDrink
                        );

                    }
                );


                item.style.cursor =
                    "pointer";


                grid.appendChild(
                    item
                );

            }
        );

}


/* ================= LOADING ================= */

function showLoading() {

    container.innerHTML = `

        <div class="loading-state">

            <span class="spinner"></span>

            <p>
                Loading drinks...
            </p>

        </div>

    `;

}


/* ================= ERROR ================= */

function showError(message) {

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
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* ================= HELPERS ================= */

function truncate(
    text,
    max
) {

    return text.length > max
        ? text.slice(0, max) + "..."
        : text;

}


function unique(drinks) {

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
        function (char) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[char];

        }
    );

}