console.debug("init")
let cards = []
let showClipboardList = true
const kBoxShadow = "0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 5px 0 rgba(0, 0, 0, 0.19)"

try {
    init()
} catch(e) {
    console.error(e)
}

function init() {
    cards = loadClipboardFromStorage()

    const detailPageCards = document.getElementsByClassName("card-image")
    if (detailPageCards && detailPageCards[0]) {
        initCardElement(detailPageCards[0])
    }

    // Initialize UI elements
    const allCardItems = Array.from(document.getElementsByClassName("card-grid-item"))
    const actualCardItems = allCardItems.filter(elem => !elem.getAttribute("aria-hidden"))
    actualCardItems.forEach(initCardElement)
    document.body.appendChild(makeButtonRow())
    document.body.appendChild(makeCardClipboardList())
}

/**
 * Initialize the card grid elements
 * @param {HTMLElement} element The card element to add a hover listener to
 */
function initCardElement(element) {
    const cardName = getCardName(element)
    const existingButton = findExistingButtons(element)[0]

    if (existingButton) {
        element.removeChild(existingButton)
    }
    
    const mappedCards = cards.map(({ cardName }) => cardName)
    // Legacy format handling
    if (mappedCards.includes(cardName) || cards.includes(cardName)) {
        element.appendChild(makeAddButton(element, true))
        console.debug(`${cardName} in local storage, added element`)
    } else {
        if (cardName) {
            console.debug(`${cardName} found on page but not in local storage`)
        } else {
            console.warn(element)
        }
    }

    element.onmouseenter = () => {
        const existingButton = findExistingButtons(element)[0]
        if (!existingButton) {
            element.appendChild(makeAddButton(element))
        }
    }
    element.onmouseleave = () => {
        const existingButton = findExistingButtons(element)[0]
        if (existingButton.className === "unselected") {
            existingButton.remove()
        }
    }
}

// UI creation
/**
 * Make a clipboard button
 * @param {HTMLElement} element The element the button will be added to
 */
function makeAddButton(element, isSelected = false) {
    const button = document.createElement("button")
    button.style.fontSize = 32
    button.style.borderRadius = "5px"
    button.style.position = "absolute"
    button.style.backgroundColor = "#F5F6F7"
    button.style.top = 0
    button.style.right = 0
    button.style.width = "30px"
    button.style.height = "30px"

    button.style.opacity = isSelected ? 1 : 0.5
    button.textContent = isSelected ? "✓" : "+"
    button.className = isSelected ? "selected" : "unselected"

    button.onclick = () => handleButtonClick(button, getCardName(element), getCardLink(element))

    return button
}

/**
 * Create an image button using one of the svgs included in the extension
 * @param {string} imageName The name of the image (w/o .svg) ex:trash -> img/trash.svg
 * @param {string} altText A string describing the image
 * @param {*} onclick The onclick handler for the button
 * @returns HTMLImageElement
 */
function makeImageButton(imageName, altText, onclick) {
    const button = document.createElement("button")
    button.style.padding = "5px"
    button.onclick = () => onclick(button)

    const image = document.createElement("img")
    image.src = chrome.runtime.getURL(`img/${imageName}.svg`)
    image.style.width = "25px"
    image.style.height = "25px"
    image.alt = altText

    button.appendChild(image)
    return button
}

/**
 * Create the row of buttons on the bottom right of the screen
 * @returns HTMLDivElement
 */
function makeButtonRow() {
    const container = document.createElement("div")
    container.style.backgroundColor = "#F5F6F7"
    container.style.borderRadius = "5px"
    container.style.position = "fixed"
    container.style.bottom = "20px"
    container.style.right = "20px"
    container.style.boxShadow = kBoxShadow

    container.appendChild(makeImageButton("duplicate", "Copy selected cards", (btn) => copyClipboard(btn)))
    container.appendChild(makeImageButton("trash", "Clear card clipboard", clearClipboard))
    container.appendChild(makeImageButton("clip", "View card clipboard", toggleClipboardList))

    return container
}

/**
 * Create a list of the selected cards
 * @returns HTMLUListElement
 */
function makeCardClipboardList() {
    const container = document.createElement("div")
    container.id = "scryfall-clipboard-list"
    container.style.position = "fixed"
    container.style.right = "20px"
    container.style.bottom = "100px"
    container.style.backgroundColor = "white"
    container.style.borderRadius = "5px"
    container.style.padding = "10px"
    container.style.boxShadow = kBoxShadow
    container.style.maxHeight = "500px"
    container.style.overflowY = "auto"

    const title = document.createElement("h3")
    title.innerText = `${cards.length} cards selected`
    title.style.textAlign = "center"
    title.style.fontWeight = "bold"
    title.style.textDecoration = "underline"
    title.style.marginBottom = "5px"

    const list = document.createElement("ul")
    for(let index in cards) {
        const listItem = document.createElement("li")

        const card = cards[index]
        // Legacy format handling
        if (card.cardLink) {
            if (card.cardLink !== document.location.toString()) {
                const link = document.createElement("a")
                link.setAttribute("href", cards[index].cardLink)
                link.textContent = cards[index].cardName
                listItem.appendChild(link)
            } else {
                listItem.textContent = card.cardName
            }
        } else {
            listItem.textContent = card
        }

        list.append(listItem)
    }

    container.appendChild(title)
    container.appendChild(list)
    return container
}

// Action handling
/**
 * Handle the clipboard button being clicked
 * @param {HTMLButtonElement} button The button that was clicked
 * @param {string} cardName The name of the card the button is associated with
 * @param {string} cardLink A link to the card that the button is associated with
 */
function handleButtonClick(button, cardName, cardLink) {
    const mappedCards = cards.map(({ cardName }) => cardName)
    if (button.className === "selected") {
        const index = mappedCards.indexOf(cardName)
        const legacyIndex = cards.indexOf(cardName)
        // Don't splice if there's no card in the list
        if (index < 0 && legacyIndex < 0) { return }
        cards.splice(index, 1)

        button.textContent = "+"
        button.className = "unselected"
        button.style.opacity = 0.5
    } else {
        // Legacy format handling
        if (!mappedCards.includes(cardName) && !cards.includes(cardName)) {
            cards.push({ cardName, cardLink })
        }

        button.textContent = "✓"
        button.className = "selected"
        button.style.opacity = 1
    }

    const encoded = JSON.stringify(cards)
    localStorage.setItem("cardClipboard", encoded)
    try {
        updateClipboardList()
    } catch(e) {
        console.error(e)
    }
}

/**
 * Copy the card clipboard to the keyboard clipboard
 * @param {HTMLButtonElement} button The copy clipboard button
 */
function copyClipboard(button) {
    try {
        flashGreenAndFade(button)
    } catch(e) {
        console.error(e)
    }
    let cardList = ""
    cards.forEach(card => {
        // Legacy format handling
        cardName = card.cardName ? card.cardName : card
        cardList += `1 ${cardName}\n`
    })
    navigator.clipboard.writeText(cardList)
}

function clearClipboard() {
    if (confirm("Clear card clipboard?")) {
        localStorage.removeItem("cardClipboard")
        const clipboardList = document.getElementById("scryfall-clipboard-list")
        if (clipboardList) {
            document.body.removeChild(clipboardList)
        }
        init()
    }
}

function toggleClipboardList() {
    if (showClipboardList) {
        const clipboardList = document.getElementById("scryfall-clipboard-list")
        document.body.removeChild(clipboardList)
        showClipboardList = false
    } else {
        showClipboardList = true
        document.body.appendChild(makeCardClipboardList())
    }
}

// Utility
/**
 * Get the card clipboard from local storage
 * @returns {string[]} The cards stored in local storage.
 */
function loadClipboardFromStorage() {
    const cardList = localStorage.getItem("cardClipboard")
    if (cardList === null) {
        return []
    }

    if (cardList.length > 0) {
        try {
            const cardsArr = JSON.parse(cardList)
            console.debug(`Loaded ${cardsArr.length} cards from local storage: ${cardsArr}`)
            return cardsArr
        } catch(e) {
            console.warn('Errored loading cards from local storage. Clearing stored clipboard')
            localStorage.removeItem("cardClipboard")
        }
    } 

    console.debug("No cards in local storage")
    return []
}

/**
 * Get the name of a card, whether we're in the search page or the
 * detail page of a single card
 * @param {HTMLElement} element The grid item to get the title from
 * @returns {string} the name of the card
 */
function getCardName(element) {
    const labels = Array.from(element.getElementsByClassName("card-grid-item-invisible-label"))
    for (index in labels) {
        if (labels[index].textContent) {
            return labels[index].textContent
        }
    }
    
    return getSingleCardName(element)
}

/**
 * Gets the name of a card when we're on a card's detail page
 * @returns {string} The name of the card
 */
function getSingleCardName() {
    // Could be a card with multiple names
    const cardNameElements = Array.from(document.getElementsByClassName("card-text-card-name"))
    const cardNames = cardNameElements.map(({ innerText }) => innerText)

    if (cardNames.length === 1) {
        return cardNames[0]
    } else if (cardNames.length > 1) {
        return cardNames.join(" // ")
    }
}

/**
 * Get the link for a card, whether we're in the search page or the
 * detail page of a single card
 * @param {HTMLElement} element The grid item to get the link from
 * @returns {string} A link to the card
 */
function getCardLink(element) {
    // If we're on a single card page, return the current url
    if (document.location.pathname.includes("/card/")) {
        return document.location.toString()
    }

    return element.children[0].getAttribute("href")
}

/** Update the clipboard list by regenerating it */
function updateClipboardList() {
    const clipboardList = document.getElementById("scryfall-clipboard-list")
    if (clipboardList) {
        document.body.removeChild(clipboardList)
    }

    if (showClipboardList) {
        document.body.appendChild(makeCardClipboardList())
    }
}

/**
 * Searches an element for buttons owned by the extension
 * @param {HTMLElement} element The element to search for buttons
 * @returns {HTMLButtonElement[]} any buttons identified as belonging to the extension
 */
function findExistingButtons(element) {
    const existingButtons = Array.from(element.getElementsByTagName("button"))
    return existingButtons.filter((elem) => ["unselected", "selected"].includes(elem.className))
}