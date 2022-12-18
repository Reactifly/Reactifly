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

export function setDomAttribute(DOMElement, name, value, previousValue)
{    
    switch (name)
    {
        // Skip
        case 'key':
        case 'ref':
            break;

        // Style
        case 'style':
            
            if (_.is_empty(value))
            {
                // remove all styles completely
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
                if (previousValue)
                {
                    events.removeEventListener(DOMElement, name.slice(2).toLowerCase(), previousValue);
                }
                if (value)
                {
                    events.addEventListener(DOMElement, name.slice(2).toLowerCase(), value);
                }
             }
            else
            {
                switch (name)
                {
                    case 'checked':
                    case 'disabled':
                    case 'selected':
                        DOMElement[name] = _.bool(value);
                        break;
                    case 'innerHTML':
                    case 'nodeValue':
                    case 'value':
                        DOMElement[name] = value;
                        break;
                    default:
                        DOMElement.removeAttribute(name)
                        break;
                }
            }
        break;
    }
}

export function removeDomAttribute(DOMElement, name, previousValue)
{
    switch (name)
    {
        // Skip
        case 'key':
        case 'ref':
            break;

        // Class
        case 'class':
        case 'className':
            DOMElement.className = '';
            break;

        // Events / attributes
        default:
            if (name[0] === 'o' && name[1] === 'n')
            {
                if (previousValue)
                {       
                    events.removeEventListener(DOMElement, name.slice(2).toLowerCase(), previousValue);
                }
            }
            else
            {
                switch (name)
                {
                    case 'checked':
                    case 'disabled':
                    case 'selected':
                        DOMElement[name] = false
                        break
                    case 'innerHTML':
                    case 'nodeValue':
                    case 'value':
                        DOMElement[name] = ''
                      break
                    default:
                        DOMElement.removeAttribute(name)
                    break;
                }
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
