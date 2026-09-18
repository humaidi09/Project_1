const API =
    "https://www.thecocktaildb.com/api/json/v1/1/";


// ================================
// GLOBAL DATA
// ================================

let selectedDrinks = [];


// ================================
// DOM ELEMENTS
// ================================

const container =
    document.getElementById("drinksContainer");

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const resultText =
    document.getElementById("resultText");

const selectedList =
    document.getElementById("selectedDrinks");

const countEl =
    document.getElementById("drinkCount");

const currentCount =
    document.getElementById("currentCount");

const progressBar =
    document.getElementById("progressBar");

const modal =
    document.getElementById("detailsModal");

const modalBody =
    document.getElementById("modalBody");

const closeModalBtn =
    document.getElementById("closeModal");

const toast =
    document.getElementById("toast");


// ================================
// PAGE LOAD
// ================================

document.addEventListener(
    "DOMContentLoaded",
    loadDefaultDrinks
);


// ================================
// SEARCH
// ================================

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


// ================================
// MODAL CLOSE
// ================================

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


// ================================
// Q1
// DEFAULT 10 DRINKS
// ================================

async function loadDefaultDrinks() {

    showLoading();


    try {

        const response =
            await fetch(
                API + "search.php?f=a"
            );


        const data =
            await response.json();


        const drinks =
            data.drinks
                ? data.drinks.slice(0, 10)
                : [];


        resultText.textContent =
            `Showing ${drinks.length} drinks`;


        renderDrinks(drinks);


    } catch (error) {

        showError(
            "Unable to load drinks. Please check your internet connection."
        );

        console.error(error);

    }

}


// ================================
// Q2
// SEARCH DRINKS
// ================================

async function searchDrinks() {

    const value =
        searchInput.value.trim();


    // Empty search
    if (!value) {

        loadDefaultDrinks();

        return;

    }


    showLoading();


    try {

        const response =
            await fetch(
                API +
                "search.php?s=" +
                encodeURIComponent(value)
            );


        const data =
            await response.json();


        const drinks =
            data.drinks || [];


        resultText.textContent =
            `Found ${drinks.length} result${
                drinks.length === 1
                    ? ""
                    : "s"
            }`;


        // No results
        if (!drinks.length) {

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


        renderDrinks(drinks);


    } catch (error) {

        showError(
            "Search failed. Please try again."
        );

        console.error(error);

    }

}


// ================================
// RENDER DRINK CARDS
// ================================

function renderDrinks(drinks) {

    container.innerHTML = "";


    drinks.forEach(function(drink) {


        // Q3
        // Instructions max 15 letters

        const instructions =
            truncate(
                drink.strInstructions ||
                "No instructions available",
                15
            );


        const card =
            document.createElement("article");


        card.className =
            "drink-card";


        card.innerHTML = `

            <div class="drink-img-wrapper">

                <img

                    class="drink-img"

                    src="${drink.strDrinkThumb}"

                    alt="${escapeHtml(
                        drink.strDrink
                    )}"

                >

            </div>


            <div class="drink-body">


                <h3 class="drink-title">

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
                    >

                        Add to Group

                    </button>


                    <button
                        class="btn details"
                    >

                        Details

                    </button>


                </div>


            </div>

        `;


        // ADD
        card
            .querySelector(".add")
            .addEventListener(
                "click",
                function() {

                    addToGroup(
                        drink.strDrink
                    );

                }
            );


        // DETAILS
        card
            .querySelector(".details")
            .addEventListener(
                "click",
                function() {

                    showDetails(
                        drink.idDrink
                    );

                }
            );


        container.appendChild(card);

    });

}


// ================================
// Q5 + Q6
// ADD TO GROUP
// ================================

function addToGroup(name) {


    // Maximum 7

    if (selectedDrinks.length >= 7) {

        alert(
            "You cannot add more than 7 drinks to the group!"
        );

        return;

    }


    // Duplicate protection

    if (selectedDrinks.includes(name)) {

        alert(
            "This drink is already in your group!"
        );

        return;

    }


    selectedDrinks.push(name);


    updateGroup();


    showToast(
        "Drink added to your group."
    );

}


// ================================
// UPDATE GROUP
// ================================

function updateGroup() {


    // Count

    countEl.textContent =
        selectedDrinks.length;


    currentCount.textContent =
        selectedDrinks.length;


    // Progress

    progressBar.style.width =
        (
            selectedDrinks.length /
            7 *
            100
        ) + "%";


    // Empty

    if (
        selectedDrinks.length === 0
    ) {

        selectedList.innerHTML = `

            <li class="empty">

                Your selected drinks
                will appear here.

            </li>

        `;

        return;

    }


    selectedList.innerHTML = "";


    selectedDrinks.forEach(
        function(name, index) {


            const li =
                document.createElement("li");


            li.innerHTML = `

                <span>

                    ${index + 1}.
                    ${escapeHtml(name)}

                </span>


                <button
                    class="remove"
                    aria-label="Remove drink"
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

                    }
                );


            selectedList.appendChild(li);

        }
    );

}


// ================================
// Q7
// DETAILS
// ================================

async function showDetails(id) {


    modal.classList.add("show");


    modalBody.innerHTML = `

        <div class="loading"
             style="display:block">

            <div class="loader"></div>

            Loading details...

        </div>

    `;


    try {

        const response =
            await fetch(
                API +
                "lookup.php?i=" +
                id
            );


        const data =
            await response.json();


        const drink =
            data.drinks &&
            data.drinks[0];


        if (!drink) {

            modalBody.innerHTML =
                "<p>Details not available.</p>";

            return;

        }


        // Ingredients

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
                            (measure || "").trim()
                        )}

                        ${escapeHtml(
                            ingredient
                        )}

                    </div>

                `);

            }

        }


        // Modal

        modalBody.innerHTML = `

            <img
                class="modal-img"

                src="${drink.strDrinkThumb}"

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
                Ingredients
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

            <p>
                Failed to load drink details.
            </p>

        `;

        console.error(error);

    }

}


// ================================
// CLOSE MODAL
// ================================

function closeModal() {

    modal.classList.remove("show");

}


// ================================
// TOAST
// ================================

function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add("show");


    setTimeout(
        function() {

            toast.classList.remove(
                "show"
            );

        },
        2000
    );

}


// ================================
// LOADING
// ================================

function showLoading() {

    container.innerHTML = `

        <div class="loading">

            <div class="loader"></div>

            Loading drinks...

        </div>

    `;

}


// ================================
// ERROR
// ================================

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


// ================================
// TRUNCATE
// ================================

function truncate(text, max) {

    if (text.length > max) {

        return text.slice(0, max) + "...";

    }

    return text;

}


// ================================
// HTML SECURITY
// ================================

function escapeHtml(value) {

    return String(value).replace(
        /[&<>"']/g,
        function(character) {

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