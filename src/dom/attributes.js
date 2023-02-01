import _ from '../utils/index';
import * as events from './events';

/**
 * List of browser prefixes
 *
 * @var array
 */
const CSS_PREFIXES =
[
    'webkit',
    'Moz',
    'ms',
    'O',
];

/**
 * CSS PREFIXABLE
 *
 * @var array
 */
const CSS_PREFIXABLE =
[
    // transitions
    'transition',
    'transition-delay',
    'transition-duration',
    'transition-property',
    'transition-timing-function',

    // trnasforms
    'transform',
    'transform-origin',
    'transform-style',
    'perspective',
    'perspective-origin',
    'backface-visibility',

    // misc
    'box-sizing',
    'calc',
    'flex',
];

/**
 * Set DOM attribute.
 *
 * @param {HTMLElement}  DOMElement  Dom node
 * @param {string}       name        Property name
 * @apram {mixed}        value       Property value
 * @oaram {mixed}        prevVal     Previous value
 */
export function setDomAttribute(DOMElement, name, value, prevVal)
{
    switch (name)
    {
        // Skip
        case 'key':
        case 'ref':
        case 'children':
        case 'innerHTML':
        case 'dangerouslySetInnerHTML':
            break;

        // Style
        case 'style':

            // remove all styles completely
            if (_.is_empty(value))
            {
                DOMElement.removeAttribute('style');
            }
            else if (_.is_string(value))
            {
                // Clear style and overwrite
                DOMElement.style = '';

                // Apply current styles
                _.foreach(value.split(';'), function(i, rule)
                {
                    var style = rule.split(':');

                    if (style.length >= 2)
                    {
                        css(DOMElement, style.shift().trim(), style.join(':').trim());
                    }
                });
            }
            else if (_.is_object(value))
            {
                _.foreach(value, function(prop, value)
                {
                    css(DOMElement, prop, value);
                });
            }
            break;

        // Class
        case 'class':
        case 'className':
            DOMElement.className = value;
            break;

            // Events / attributes
        default:
            if (name[0] === 'o' && name[1] === 'n')
            {
                // Remove old listener
                if (prevVal)
                {
                    events.removeEventListener(DOMElement, name.slice(2).toLowerCase(), prevVal);
                }

                // Add new listener
                if (value)
                {
                    events.addEventListener(DOMElement, name.slice(2).toLowerCase(), value);
                }
            }
            else
            {
                if (
                    name !== 'href' &&
                    name !== 'list' &&
                    name !== 'form' &&
                    // Default value in browsers is `-1` and an empty string is
                    // cast to `0` instead
                    name !== 'tabIndex' &&
                    name !== 'download' &&
                    name in DOMElement
                ) {
                    try {
                        DOMElement[name] = value == null ? '' : value;
                        // labelled break is 1b smaller here than a return statement (sorry)
                        break;
                    } catch (e) {}
                }

                // ARIA-attributes have a different notion of boolean values.
                // The value `false` is different from the attribute not
                // existing on the DOM, so we can't remove it. For non-boolean
                // ARIA-attributes we could treat false as a removal, but the
                // amount of exceptions would cost us too many bytes. On top of
                // that other VDOM frameworks also always stringify `false`.

                if (typeof value === 'function') {
                    // never serialize functions as attribute values
                } else if (value != null && (value !== false || name.indexOf('-') != -1)) {
                    DOMElement.setAttribute(name, value);
                } else {
                    DOMElement.removeAttribute(name);
                }
            }
            break;
    }
}

/**
 * Remove DOM attribute.
 *
 * @param {HTMLElement}  DOMElement  Dom node
 * @param {string}       name        Property name
 * @apram {mixed}        prevVal     Property value
 */
export function removeDomAttribute(DOMElement, name, prevVal)
{
    switch (name)
    {
        // Skip
        case 'key':
        case 'ref':
        case 'children':
        case 'dangerouslySetInnerHTML':
            break;

        // Class
        case 'class':
        case 'className':
            DOMElement.className = '';
            break;

        // InnerHTML
        case 'dangerouslySetInnerHTML':
            DOMElement.innerHTML = '';
            break;

            // Events / attributes
        default:
            if (name[0] === 'o' && name[1] === 'n')
            {
                if (prevVal)
                {
                    events.removeEventListener(DOMElement, name.slice(2).toLowerCase(), prevVal);
                }
            }
            else
            {                
                if (
                    name !== 'href' &&
                    name !== 'list' &&
                    name !== 'form' &&
                    // Default value in browsers is `-1` and an empty string is
                    // cast to `0` instead
                    name !== 'tabIndex' &&
                    name !== 'download' &&
                    name in DOMElement
                ) {
                    try
                    {
                        DOMElement[name] = '';
                        // labelled break is 1b smaller here than a return statement (sorry)
                        break;
                    } catch (e) {}
                }

                DOMElement.removeAttribute(name);
            }
            break;
    }
}

/**
 * Set CSS value(s) on element
 *
 * @access public
 * @param  node   el     Target DOM node
 * @param  string|object Assoc array of property->value or string property
 * @example Helper.css(node, { display : 'none' });
 * @example Helper.css(node, 'display', 'none');
 */
function css(el, property, value)
{
    // If their is no value and property is an object
    if (_.is_object(property))
    {
        _.foreach(property, function(prop, val)
        {
            css(el, prop, val);
        });
    }
    else
    {
        // vendor prefix the property if need be and convert to camelCase
        var properties = _vendorPrefix(property);

        // Loop vendored (if added) and unvendored properties and apply
        _.foreach(properties, function(i, prop)
        {
            el.style[prop] = value;
        });
    }
}

/**
 * Vendor prefix a css property and convert to camelCase
 *
 * @access private
 * @param  string property The CSS base property
 * @return array
 */
function _vendorPrefix(property)
{
    // Properties to return
    var props = [];

    // Convert to regular hyphenated property 
    property = _camelCaseToHyphen(property);

    // Is the property prefixable ?
    if (CSS_PREFIXABLE.includes(property))
    {
        var prefixes = CSS_PREFIXES;

        // Loop vendor prefixes
        for (var i = 0; i < prefixes.length; i++)
        {
            props.push(prefixes[i] + _ucfirst(_toCamelCase(property)));
        }
    }

    // Add non-prefixed property
    props.push(_toCamelCase(property));

    return props;
}

function _toCamelCase(str)
{
    return str.toLowerCase()
        .replace(/['"]/g, '')
        .replace(/\W+/g, ' ')
        .replace(/ (.)/g, function($1)
        {
            return $1.toUpperCase();
        })
        .replace(/ /g, '');
}

function _camelCaseToHyphen(str)
{
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1-$2$3').toLowerCase();
}

function _ucfirst(string)
{
    return (string + '').charAt(0).toUpperCase() + string.slice(1);
}