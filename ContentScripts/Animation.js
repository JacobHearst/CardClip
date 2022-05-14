// Honestly no idea, taken from: https://stackoverflow.com/questions/11292649/javascript-color-animation#11293378
function lerp(a, b, u) {
    return (1 - u) * a + u * b
}

function fade(element, start, end, duration) {
    var interval = 10
    var steps = duration / interval
    var step_u = 1.0 / steps
    var u = 0.0
    var theInterval = setInterval(
        function () {
            if (u >= 1.0) {
                clearInterval(theInterval)
            }
            var r = parseInt(lerp(start.r, end.r, u))
            var g = parseInt(lerp(start.g, end.g, u))
            var b = parseInt(lerp(start.b, end.b, u))
            var colorname = 'rgb(' + r + ',' + g + ',' + b + ')'
            element.style.setProperty('background-color', colorname)
            u += step_u
        },
        interval)
}

function flashGreenAndFade(element) {
    property = 'background-color' // fading property
    startColor = {
        r: 97,
        g: 216,
        b: 0
    }
    endColor = {
        r: 245,
        g: 246,
        b: 247
    }
    fade(element, startColor, endColor, 500)
}