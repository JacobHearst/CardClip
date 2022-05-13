// Load data
let cards = []
loadClipboardFromStorage()

// Initialize UI elements
const allCardItems = Array.from(document.getElementsByClassName("card-grid-item"))
const actualCardItems = allCardItems.filter(elem => !elem.getAttribute("aria-hidden"))
actualCardItems.forEach(initCardElements)
document.body.appendChild(makeCopyButton())

/**
 * Add a hover listener to an element
 * @param {HTMLElement} element The card element to add a hover listener to
 */
function initCardElements(element) {
    let cardName = getCardName(element)
    if (cards.includes(cardName)) {
        element.appendChild(makeAddButton(element, true))
        console.log(`${cardName} in local storage, added element`)
    }

    element.onmouseenter = () => {
        const existingButton = element.getElementsByTagName("button")[0]
        if (!existingButton) {
            element.appendChild(makeAddButton(element))
        }
    }
    element.onmouseleave = () => {
        const existingButton = element.getElementsByTagName("button")[0]
        if (existingButton.className !== "selected") {
            existingButton.remove()
        }
    }
}

/**
 * Make a clipboard button
 * @param {HTMLElement} element The element the button will be added to
 */
function makeAddButton(element, isSelected = false) {
    let button = document.createElement("button")
    button.style.fontSize = 32
    button.style.borderRadius = "5px"
    button.style.position = "absolute"
    button.style.backgroundColor = "white"
    button.style.top = 0
    button.style.right = 0
    button.style.width = "30px"
    button.style.height = "30px"

    button.style.opacity = isSelected ? 1 : 0.5
    button.textContent = isSelected ? "✓" : "+"
    button.className = isSelected ? "selected" : ""

    button.onclick = () => handleButtonClick(button, getCardName(element))

    return button
}

function makeCopyButton() {
    let copyClipboardButton = document.createElement("button")
    copyClipboardButton.textContent = "Copy Selected Cards"

    copyClipboardButton.style.backgroundColor = "gray"
    copyClipboardButton.style.color = "white"
    copyClipboardButton.style.position = "fixed"
    copyClipboardButton.style.bottom = "20px"
    copyClipboardButton.style.right = "20px"
    copyClipboardButton.style.padding = "5px"
    copyClipboardButton.onclick = copyClipboard

    return copyClipboardButton
}

/**
 * Handle the clipboard button being clicked
 * @param {HTMLButtonElement} button The button that was clicked
 * @param {string} cardName The name of the card the button is associated with
 */
function handleButtonClick(button, cardName) {
    if (button.className === "selected") {
        const index = cards.indexOf(cardName)
        cards.splice(index, 1)

        button.textContent = "+"
        button.className = ""
        button.style.opacity = 0.5
    } else {
        if (!cards.includes(cardName)) {
            cards.push(cardName)
        }

        button.textContent = "✓"
        button.className = "selected"
        button.style.opacity = 1
    }

    localStorage.setItem("cardClipboard", cards)
}

function copyClipboard() {
    let cardList = ""
    cards.forEach(card => cardList += `1 ${card}\n`)
    navigator.clipboard.writeText(cardList)
}

function loadClipboardFromStorage() {
    let cardList = localStorage.getItem("cardClipboard")

    if (cardList.length > 0) {
        cards = cardList.split(",")
        console.debug(`Loaded ${cards.length} cards from local storage: ${cardList}`)
    } else {
        console.debug("No cards in local storage")
    }
}

function getCardName(element) {
    return element.getElementsByClassName("card-grid-item-invisible-label")[0].textContent
}