console.debug("init")
let cards = []
let showClipboardList = true
const kBoxShadow = "0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 5px 0 rgba(0, 0, 0, 0.19)"
let retries = 0

try {
    init()
} catch (e) {
    console.error(e)
}

function init() {
    clearUI()

    cards = loadClipboardFromStorage()

    const detailPageCards = document.getElementsByClassName("card-image")
    const isTagger = document.location.host.includes("tagger")
    if (detailPageCards && detailPageCards[0] && !isTagger) {
        initCardElement(detailPageCards[0])
    }

    // Initialize UI elements
    const allCardItems = Array.from(document.getElementsByClassName("card-grid-item"))
    const actualCardItems = allCardItems.filter(elem => !elem.getAttribute("aria-hidden"))
    if (actualCardItems.length == 0 && retries < 3) {
        console.debug(`No cards detected, sleeping and trying ${3 - retries} more times`)
        retries++
        sleep(500).then(init)
    } else if (actualCardItems.length > 0) {
        console.debug("Found cards, initializing card elements")
        actualCardItems.forEach(initCardElement)
    } else {
        console.debug("No cards found and out of retries")
    }

    document.body.appendChild(makeButtonRow())
    document.body.appendChild(makeCardClipboardList())
}

/**
 * Initialize the card grid elements
 * @param {HTMLElement} element The card element to add a hover listener to
 */
function initCardElement(element) {
    // Handle cards with two faces
    const transformButton = document.querySelectorAll("[data-component='card-backface-button']")[0]
    if (transformButton) {
        transformButton.onclick = () => transformButton(element)
    }

    // Remove any existing button
    const existingButton = findExistingButtons(element)[0]
    if (existingButton) {
        element.removeChild(existingButton)
    }

    const cardName = getCardName(element)
    const cardNames = cards.map(card => card.cardName)
    if (cardNames.includes(cardName)) {
        element.appendChild(makeAddButton(element, true))
        console.debug(`${cardName} in local storage, added element`)
    } else {
        if (cardName) {
            console.debug(`${cardName} found on page but not in local storage`)
        } else {
            console.warn("Couldn't find a name for the below element")
            console.warn(element)
        }
    }

    // Add handlers to show the add button on hover
    element.onmouseenter = () => {
        const existingButton = findExistingButtons(element)[0]
        if (!existingButton) {
            element.appendChild(makeAddButton(element, false))
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
    button.style.border = "none"

    const transform = getIconTransform(element)
    if (transform) {
        button.style.transform = transform
        button.style.left = 0
        button.style.right = undefined
    }

    button.style.opacity = isSelected ? 1 : 0.5
    button.textContent = isSelected ? "✓" : "+"
    button.className = isSelected ? "selected" : "unselected"

    button.onclick = () => handleAddButtonClick(button, getCardName(element), getCardLink(element))

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
    button.style.border = "none"
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
    container.id = "card-clip-button-row"
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
    title.style.color = "black"
    title.style.fontSize = "15px"

    const list = document.createElement("ul")
    list.style.paddingLeft = "0"
    for (let index in cards) {
        const listItem = document.createElement("li")

        const card = cards[index]
        if (card.cardLink !== document.location.toString()) {
            const link = document.createElement("a")
            link.style.display = "inline-block"
            link.setAttribute("href", cards[index].cardLink)
            link.textContent = cards[index].cardName
            listItem.appendChild(link)
        } else {
            const cardLabel = document.createElement("p")
            cardLabel.textContent = card.cardName
            cardLabel.style.display = "inline-block"
            cardLabel.style.color = "black"
            listItem.appendChild(cardLabel)
        }

        const deleteButton = document.createElement("button")
        deleteButton.textContent = "x"
        deleteButton.style.float = "right"
        deleteButton.style.backgroundColor = "transparent"
        deleteButton.style.border = "none"
        deleteButton.style.textDecoration = "underline"
        deleteButton.style.display = "inline-block"
        deleteButton.style.paddingLeft = "5px"
        deleteButton.style.color = "blue"
        deleteButton.onclick = () => removeCard(card.cardName)
        listItem.appendChild(deleteButton)

        list.append(listItem)
    }

    container.appendChild(title)
    container.appendChild(list)
    return container
}

// Action handling
/**
 * Transform the add button to match the card it's attached to
 * @param {HTMLElement} element The element the button will be added to
 */
function transformButton(element) {
    const existingButton = findExistingButtons(element)[0]
    const transform = getIconTransform(element)
    // If the parent is transformed
    if (transform) {
        // Move the button to the other corner
        const oldRight = existingButton.style.right
        existingButton.style.right = existingButton.style.left
        existingButton.style.left = oldRight

        // And apply the inverse transformation
        existingButton.style.transform = transform
    } else if (existingButton.style.transform) {
        // Otherwise, if the button is already transformed

        // Move the button to the other corner
        const oldRight = existingButton.style.right
        existingButton.style.right = existingButton.style.left
        existingButton.style.left = oldRight

        // And clear the transformation
        existingButton.style.transform = "rotate(0deg)"
    }
}

/**
 * Handle the add button being clicked
 * @param {HTMLButtonElement} button The button that was clicked
 * @param {string} cardName The name of the card the button is associated with
 * @param {string} cardLink A link to the card that the button is associated with
 */
function handleAddButtonClick(button, cardName, cardLink) {
    const cardNames = cards.map(card => card.cardName)
    if (button.className === "selected") {
        removeCard(cardName)

        button.textContent = "+"
        button.className = "unselected"
        button.style.opacity = 0.5
    } else {
        if (!cardNames.includes(cardName)) {
            cards.push({ cardName, cardLink })
            updateStorage()
        }

        button.textContent = "✓"
        button.className = "selected"
        button.style.opacity = 1
    }
}

/**
 * Copy the card clipboard to the keyboard clipboard
 * @param {HTMLButtonElement} button The copy clipboard button
 */
function copyClipboard(button) {
    try {
        flashGreenAndFade(button)
    } catch (e) {
        console.error(e)
    }
    let cardList = ""
    cards.forEach(card => {
        cardList += `1 ${card.cardName}\n`
    })
    navigator.clipboard.writeText(cardList)
}

function clearClipboard() {
    if (confirm("Clear card clipboard?")) {
        localStorage.removeItem("cardClipboard")
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
        } catch (e) {
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
    // Try to get the name using the invisible label
    const labels = Array.from(element.getElementsByClassName("card-grid-item-invisible-label"))
    for (index in labels) {
        if (labels[index].textContent) {
            return labels[index].textContent
        }
    }

    // Try to get the name using the alt text for the image (used primarily for tagger)
    const images = element.getElementsByTagName("img")
    if (images.length > 0) {
        return images[0].getAttribute("alt")
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
    const cardNames = cardNameElements.map(element => element.innerText)

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

/**
 * Get the transform string (if any) for the icon
 * @param {HTMLElement} element The element the button will be added to
 */
function getIconTransform(element) {
    if (element.classList.contains("horizontal")) {
        return "rotate(-90deg)"
    }

    if (element.classList.contains("flip-backside")) {
        return "rotateY(180deg)"
    }
}

function updateStorage() {
    const encoded = JSON.stringify(cards)
    localStorage.setItem("cardClipboard", encoded)
    try {
        updateClipboardList()
    } catch (e) {
        console.error(e)
    }
}

function removeCard(cardName) {
    const cardNames = cards.map(card => card.cardName)
    const index = cardNames.indexOf(cardName)
    // Don't splice if there's no card in the list
    if (index < 0) {
        return
    }
    cards.splice(index, 1)

    // Refresh the UI
    updateStorage()
    init()
}

function clearUI() {
    const clipboardList = document.getElementById("scryfall-clipboard-list")
    if (clipboardList) {
        document.body.removeChild(clipboardList)
    }

    const buttonRow = document.getElementById("card-clip-button-row")
    if (buttonRow) {
        document.body.removeChild(buttonRow)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}