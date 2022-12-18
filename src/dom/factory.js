const SVG_ELEMENTS = 'animate circle clipPath defs ellipse g line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan use'.split(' ');

const SVG_MAP = SVG_ELEMENTS.reduce(function (acc, name)
{
    acc[name] = true;
    
    return acc;

}, {});

function has(prop, obj)
{
    return Object.prototype.hasOwnProperty.call(obj, prop)
}

function isSvg(name)
{
    return has(name, SVG_MAP)
}

export default function createNativeElement(tag)
{
    return isSvg(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
}