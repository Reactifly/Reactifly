/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// UNUSED EXPORTS: Component, Fragment, createElement, createRoot, default, h, jsx, register, render, useState

;// CONCATENATED MODULE: ./src/dom/factory.js
const SVG_ELEMENTS = 'animate circle clipPath defs ellipse g line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan use'.split(' ');

const SVG_MAP = SVG_ELEMENTS.reduce(function(acc, name)
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

function createNativeElement(tag)
{
    return isSvg(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
}
;// CONCATENATED MODULE: ./src/utils/index.js
/**
 * Object with built in "dot.notation" set,get,isset,delete methods.
 *
 * @return {object}
 */
const _map = function()
{
    return this;
}

_map.prototype = {};

_map.prototype.set = function(key, value)
{
    array_set(key, value, this);
};

_map.prototype.get = function(key)
{
    return utils_array_get(key, this);
};

_map.prototype.delete = function(key)
{
    array_delete(key, this);
};

_map.prototype.isset = function(key)
{
    return array_has(key, this);
};

/**
 * Returns an immutable object with set,get,isset,delete methods that accept dot.notation.
 *
 * @returns {object}
 */
function obj()
{
    return new _map;
}

/**
 * Triggers a native event on an element.
 *
 * @param  {HTMLElement}  el    Target element
 * @param  {string}       type  Valid event name
 */
function triggerEvent(el, type)
{
    if ('createEvent' in document)
    {
        var evt = document.createEvent("HTMLEvents");

        evt.initEvent(type, false, true);

        el.dispatchEvent(evt);
    }
    else
    {
        el.fireEvent(type);
    }
}

/**
 * Set a key using dot/bracket notation on an object or array.
 *
 * @param   {string}       path   Path to set
 * @param   {mixed}        value  Value to set
 * @param   {object|array} object Object to set into
 * @returns {object|array}
 */
function array_set(path, value, object)
{
    _arraySetRecursive(_arrayKeySegment(path), value, object);

    return object;
}

/**
 * Gets an from an array/object using dot/bracket notation.
 *
 * @param   {string}        path    Path to get
 * @param   {object|array}  object  Object to get from
 * @returns {mixed}
 */
function utils_array_get(path, object)
{
    return _arrayGetRecursive(_arrayKeySegment(path), object);
}

/**
 * Checks if array/object contains path using dot/bracket notation.
 *
 * @param   {string}        path   Path to check
 * @param   {object|array}  object Object to check on
 * @returns {boolean}
 */
function array_has(path, object)
{
    return typeof utils_array_get(path, object) !== 'undefined';
}

/**
 * Deletes from an array/object using dot/bracket notation.
 *
 * @param   {string}        path   Path to delete
 * @param   {object|array}  object Object to delete from
 * @returns {object|array}
 */
function array_delete(path, object)
{
    _arrayDeleteRecursive(_arrayKeySegment(path), object);

    return object;
}

/**
 * Filters empty array entries and returns new array
 *
 * @param   {object|array}  object Object to delete from
 * @returns {object|array}
 */
function array_filter(arr)
{
    let isArr = is_array(arr);

    let ret = isArr ? [] : {};

    foreach(arr, function(i, val)
    {
        if (!is_empty(val))
        {
            isArr ? ret.push(val) : ret[i] = val;
        }
    });

    return ret;
}

/**
 * Merges multiple objects or arrays into the original.
 *
 * @param   {object|array} First array then any number of array or objects to merge into
 * @returns {object|array}
 */
function array_merge()
{
    let args = Array.prototype.slice.call(arguments);

    if (args.length === 0)
    {
        throw new Error('Nothing to merge.');
    }
    else if (args.length === 1)
    {
        return args[1];
    }

    let first = args.shift();
    let fType = is_array(first) ? 'array' : 'obj';

    foreach(args, function(i, arg)
    {
        if (!is_array(arg) && !is_object(arg))
        {
            throw new Error('Arguments must be an array or object.');
        }

        foreach(arg, function(i, val)
        {
            fType === 'array' ? first.push(val) : first[i] = val;
        });
    });

    return first;
}

/**
 * Recursively delete from array/object.
 *
 * @param   {array}        keys    Keys in search order
 * @param   {object|array} object  Object to get from
 * @returns {mixed}
 */
function _arrayDeleteRecursive(keys, object)
{
    var key = keys.shift();

    var islast = keys.length === 0;

    if (islast)
    {
        if (Object.prototype.toString.call(object) === '[object Array]')
        {
            object.splice(key, 1);
        }
        else
        {
            delete object[key];
        }
    }

    if (!object[key])
    {
        return false;
    }

    return _arrayDeleteRecursive(keys, object[key]);
}

/**
 * Recursively search from array/object.
 *
 * @param   {array}        keys    Keys in search order
 * @param   {object|array} object  Object to get from
 * @returns {mixed}
 */
function _arrayGetRecursive(keys, object)
{
    var key = keys.shift();
    var islast = keys.length === 0;

    if (islast)
    {
        return object[key];
    }

    if (!object[key])
    {
        return undefined;
    }

    return _arrayGetRecursive(keys, object[key]);
}

/**
 * Recursively set array/object.
 *
 * @param {array}          keys     Keys in search order
 * @param {mixed}          value    Value to set
 * @param {object|array}   object   Object to get from
 * @param {string|number}  nextKey  Next key to set
 */
function _arraySetRecursive(keys, value, object, nextKey)
{
    var key = keys.shift();
    var islast = keys.length === 0;
    var lastObj = object;
    object = !nextKey ? object : object[nextKey];

    // Trying to set a value on nested array that doesn't exist
    if (!['object', 'function'].includes(typeof object))
    {
        throw new Error('Invalid dot notation. Cannot set key "' + key + '" on "' + JSON.stringify(lastObj) + '[' + nextKey + ']"');
    }

    if (!object[key])
    {
        // Trying to put object key into an array
        if (Object.prototype.toString.call(object) === '[object Array]' && typeof key === 'string')
        {
            var converted = Object.assign({}, object);

            lastObj[nextKey] = converted;

            object = converted;
        }

        if (keys[0] && typeof keys[0] === 'string')
        {
            object[key] = {};
        }
        else
        {
            object[key] = [];
        }
    }

    if (islast)
    {
        object[key] = value;

        return;
    }

    _arraySetRecursive(keys, value, object, key);
}

/**
 * Segments an array/object path using from "dot.notation" into an array of keys in order.
 *
 * @param   {string}  path Path to parse
 * @returns {array}
 */
function _arrayKeySegment(path)
{
    var result = [];
    var segments = path.split('.');

    for (var i = 0; i < segments.length; i++)
    {
        var segment = segments[i];

        if (!segment.includes('['))
        {
            result.push(segment);

            continue;
        }

        var subSegments = segment.split('[');

        for (var j = 0; j < subSegments.length; j++)
        {
            if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(subSegments[j][0]))
            {
                result.push(parseInt(subSegments[j].replace(']')));
            }
            else if (subSegments[j] !== '')
            {
                result.push(subSegments[j])
            }
        }
    }

    return result;
}

/**
 * Creates a new object in 'dot.notation'
 * 
 * @param   {Object} obj Object
 * @returns {Object} 
 */
function dotify(obj)
{
    var res = {};

    function recurse(obj, current)
    {
        for (var key in obj)
        {
            var value = obj[key];
            var newKey = (current ? current + '.' + key : key); // joined key with dot

            if (value && typeof value === 'object' && !(value instanceof Date))
            {
                recurse(value, newKey); // it's a nested object, so do it again
            }
            else
            {
                res[newKey] = value; // it's not an object, so set the property
            }
        }
    }

    recurse(obj);

    return res;
}

/**
 * Checks if HtmlElement is in current DOM
 *
 * @param   {HTMLElement}  element  Element to check
 * @returns {boolean}
 */
function in_dom(element)
{
    if (!is_htmlElement(element))
    {
        return false;
    }

    if (element === document.body || element === document.documentElement)
    {
        return true;
    }

    while (element)
    {
        if (element === document.documentElement)
        {
            return true;
        }

        element = element.parentNode;
    }

    return false;
}

/**
 * Checks if variable is HTMLElement.
 *
 * @param   {mixed}  mixed_var  Variable to evaluate
 * @returns {boolean}
 */
function is_htmlElement(mixed_var)
{
    return !!(mixed_var && mixed_var.nodeType === 1);
}

/**
 * Is variable a function / constructor.
 *
 * @param   {mixed}  mixed_var  Variable to check
 * @returns {boolean}
 */
function is_callable(mixed_var)
{
    return Object.prototype.toString.call(mixed_var) === '[object Function]';
}

/**
 * Checks if variable is construable.
 *
 * @param   {mixed}  mixed_var  Variable to evaluate
 * @returns {boolean}
 */
function is_constructable(mixed_var)
{
    // Not a function
    if (typeof mixed_var !== 'function' || mixed_var === null)
    {
        return false;
    }

    // Native arrow functions
    if (!mixed_var.prototype || !mixed_var.prototype.constructor)
    {
        return false;
    }

    // Strict ES6 class
    if (is_class(mixed_var, true))
    {
        return true;
    }

    // If prototype is empty 
    let props = object_props(mixed_var.prototype);

    return props.length >= 1;
}

/**
 * Checks if variable is a class declaration or extends a class and/or constructable function.
 *
 * @param   {mixed}                        mixed_var  Variable to evaluate
 * @oaram   {string | undefined | boolean} classname  Classname or strict if boolean provided
 * @param   {boolean}                      strict     If "true" only returns true on ES6 classes (default "false")
 * @returns {boolean}
 */
function is_class(mixed_var, classname, strict)
{
    // is_class(foo, true)
    if (classname === true || classname === false)
    {
        strict = classname;
        classname = null;
    }
    // is_class(foo, 'Bar') || is_class(foo, 'Bar', false)
    else
    {
        strict = typeof strict === 'undefined' ? false : strict;
    }

    if (classname)
    {
        if (typeof mixed_var === 'function')
        {
            // Check for ES6 class decleration
            let re = new RegExp('^\\s*class\\s+(' + classname + '(\\s+|\\{)|\\w+\\s+extends\\s+' + classname + ')', 'i');

            let regRet = re.test(mixed_var.toString());

            if (strict)
            {
                return regRet;
            }

            // Constructable or ES6 class declaration depending on strict
            return is_constructable(mixed_var) && mixed_var.name === classname;
        }

        return false;
    }

    // ES6 class declaration depending on strict
    if (strict)
    {

        return typeof mixed_var === 'function' && /^\s*class\s+/.test(mixed_var.toString());
    }

    // Constructable
    return is_constructable(mixed_var);
}

/**
 * Returns function / class name
 *
 * @param   {mixed}  mixed_var Variable to evaluate
 * @returns {string}
 */
function callable_name(mixed_var)
{
    // Strict ES6
    if (is_class(mixed_var, true))
    {
        return mixed_var.toString().match(/^\s*class\s+\w+/)[0].replace('class', '').trim();
    }
    else if (is_callable(mixed_var))
    {
        return mixed_var.name;
    }
    else if (is_object(mixed_var))
    {
        return mixed_var.constructor.name;
    }
}

/**
 * Returns array/object/string/number size.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {number}
 */
function size(mixed_var)
{
    if (is_string(mixed_var) || is_array(mixed_var))
    {
        return mixed_var.length;
    }
    else if (is_number(mixed_var))
    {
        return mixed_var;
    }
    else if (is_bool(mixed_var))
    {
        return mixed_var === true ? 1 : -1;
    }
    else(is_object(mixed_var))
    {
        return Object.keys(mixed_var).length;
    }

    return 1;
}

/**
 * Checks if variable should be considered "true" or "false" using "common sense".
 * 
 * @param   {mixed} mixed_var  Variable to test
 * @returns {boolean}
 */
function bool(mixed_var)
{
    mixed_var = (typeof mixed_var === 'undefined' ? false : mixed_var);

    if (is_bool(mixed_var))
    {
        return mixed_var;
    }

    if (is_number(mixed_var))
    {
        return mixed_var > 0;
    }

    if (is_array(mixed_var))
    {
        return mixed_var.length > 0;
    }

    if (is_object(mixed_var))
    {
        return Object.keys(mixed_var).length > 0;
    }

    if (is_string(mixed_var))
    {
        mixed_var = mixed_var.toLowerCase().trim();

        if (mixed_var === 'false')
        {
            return false;
        }
        if (mixed_var === 'true')
        {
            return true;
        }
        if (mixed_var === 'on')
        {
            return true;
        }
        if (mixed_var === 'off')
        {
            return false;
        }
        if (mixed_var === 'undefined')
        {
            return false;
        }
        if (is_numeric(mixed_var))
        {
            return Number(mixed_var) > 0;
        }
        if (mixed_var === '')
        {
            return false;
        }
    }

    return false;
}

/**
 * Checks if variable is an object.
 *
 * @param   {mixed}  mixed_var Variable to evaluate
 * @returns {boolean}
 */
function is_object(mixed_var)
{
    return mixed_var !== null && (Object.prototype.toString.call(mixed_var) === '[object Object]');
}

/**
 * Is array.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_array(mixed_var, strict)
{
    strict = typeof strict === 'undefined' ? false : strict;

    let type = Object.prototype.toString.call(mixed_var);

    return !strict ? type === '[object Array]' || type === '[object Arguments]' || type === '[object NodeList]' : type === '[object Array]';
}

/**
 * Is string.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_string(mixed_var)
{
    return typeof mixed_var === 'string' || mixed_var instanceof String;
}

/**
 * Is number.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_number(mixed_var)
{
    return typeof mixed_var === 'number' && !isNaN(mixed_var);
}

/**
 * Is string.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_numeric(mixed_var)
{
    if (is_number(mixed_var))
    {
        return true;
    }
    else if (is_string(mixed_var))
    {
        return /^-?\d+$/.test(mixed_var.trim());
    }

    return false;
}

/**
 * Is undefined.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_undefined(mixed_var)
{
    return typeof mixed_var === 'undefined';
}

/**
 * Is null.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_null(mixed_var)
{
    return mixed_var === null;
}

/**
 * Is bool.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_bool(mixed_var)
{
    return mixed_var === false || mixed_var === true;
}

/**
 * Returns object properties and methods as array of keys.
 * 
 * @param   {mixed}    mixed_var    Variable to test
 * @param   {boolean}  withMethods  Return methods and props (optional) (default "true")
 * @returns {array}
 */
function object_props(mixed_var, withMethods)
{
    withMethods = is_undefined(withMethods) ? true : false;

    if (!is_object(mixed_var))
    {
        return [];
    }

    // If prototype is empty 
    let excludes = ['constructor', '__proto__', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__', '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf'];
    let funcs = Object.getOwnPropertyNames(Object.getPrototypeOf(mixed_var));
    let props = Object.keys(mixed_var);
    let keys = withMethods ? [...funcs, ...props] : props;

    return keys.filter(function(key)
    {
        return !excludes.includes(key);
    });
}

/**
 * Is empty
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
function is_empty(mixed_var)
{
    if (mixed_var === false || mixed_var === null || (typeof mixed_var === 'undefined'))
    {
        return true;
    }
    else if (is_string(mixed_var))
    {
        return mixed_var.trim() === '';
    }
    else if (is_number(mixed_var))
    {
        return mixed_var === 0 || isNaN(mixed_var);
    }
    else if (is_array(mixed_var))
    {
        return mixed_var.length === null || mixed_var.length <= 0;
    }
    else if (is_object(mixed_var))
    {
        return Object.keys(mixed_var).length === 0;
    }

    return false;
}

/**
 * Checks if traversable's are equal
 * 
 * @param   {array | object}  a
 * @param   {array | object}  b
 * @returns {boolean}
 */
function equalTraverseable(a, b)
{
    if (size(a) !== size(b))
    {
        return false;
    }

    let ret = true;

    foreach(a, function(i, val)
    {
        if (!utils_is_equal(val, b[i]))
        {
            ret = false;

            return false;
        }
    });

    return ret;
}

/**
 * Deep check for equal
 * 
 * @param   {mixed}  a
 * @param   {mixed}  b
 * @returns {boolean}
 */
function utils_is_equal(a, b)
{
    if ((typeof a) !== (typeof b))
    {
        return false;
    }
    else if (is_string(a) || is_number(a) || is_bool(a) || is_null(a))
    {
        return a === b;
    }
    else if (is_array(a) || is_object(b))
    {
        if (a === b)
        {
            return true;
        }
        else if (is_array(a) && !is_array(b))
        {
            return false;
        }

        return equalTraverseable(a, b);
    }

    return true;
}

/**
 * Clones an object
 * 
 * @param   {object}  obj
 * @returns {object}
 */
function cloneObj(obj)
{
    // Handle date objects
    if (obj instanceof Date)
    {
        let r = new Date();

        r.setTime(obj.getTime());

        return r;
    }

    // Loop keys and functions
    let keys = object_props(obj);
    let ret = {};

    if (keys.length === 0)
    {
        return ret;
    }

    foreach(keys, function(i, key)
    {
        ret[key] = cloneDeep(obj[key], ret);
    });

    return ret;
}

/**
 * Clones a function
 * 
 * @param   {function}  function
 * @param   {mixed}     context   Context to bind function
 * @returns {function}
 */
function cloneFunc(func, context)
{
    context = typeof context === 'undefined' ? func : window;

    return func.bind(context);
}

/**
 * Clones an array
 * 
 * @param   {array}  arr
 * @returns {array}
 */
function cloneArray(arr)
{
    let ret = [];

    foreach(arr, function(i, val)
    {
        ret[i] = cloneDeep(val);
    });

    return ret;
}

/**
 * Clones any variables
 * 
 * @param   {mixed}  mixed_var
 * @param   {mixed}  context   Context to bind functions
 * @returns {mixed}
 */
function cloneDeep(mixed_var, context)
{
    if (is_object(mixed_var))
    {
        return cloneObj(mixed_var);
    }
    else if (is_array(mixed_var))
    {
        return cloneArray(mixed_var);
    }
    else if (is_string(mixed_var))
    {
        return mixed_var.slice();
    }
    else if (is_number(mixed_var))
    {
        let r = mixed_var;

        return r;
    }
    else if (is_null(mixed_var))
    {
        return null;
    }
    else if (is_undefined(mixed_var))
    {
        return;
    }
    else if (is_bool(mixed_var))
    {
        return mixed_var === true ? true : false;
    }
    else if (is_callable(mixed_var))
    {
        return cloneFunc(mixed_var, context);
    }

    let r = mixed_var;

    return r;
}

/**
 * Deep merge two objects.
 * 
 * @param   {object} target
 * @param   {object} ...sources
 * @returns {object}
 */
function mergeDeep(target, ...sources)
{
    if (!sources.length) return target;

    const source = sources.shift();

    if (is_object(target) && is_object(source))
    {
        for (const key in source)
        {
            if (is_object(source[key]))
            {
                if (!target[key]) Object.assign(target,
                {
                    [key]: {}
                });

                mergeDeep(target[key], source[key]);
            }
            else
            {
                Object.assign(target,
                {
                    [key]: source[key]
                });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

/**
 * Foreach.
 *  
 * @param   {array|object}  obj
 * @param   {function}      callback
 * @param   {array|mixed}   args      If single arg provided gets apllied as this to callback, otherwise args apllied to callback
 * @returns {array|object}
 */
function foreach(obj, callback, args)
{
    var value, i = 0,
        length = obj.length,
        isArray = Object.prototype.toString.call(obj) === '[object Array]';

    var thisArg = typeof args !== 'undefined' && Object.prototype.toString.call(args) !== '[object Array]' ? args : obj;

    if (Object.prototype.toString.call(args) === '[object Array]')
    {
        if (isArray)
        {
            for (; i < length; i++)
            {
                value = callback.apply(thisArg, array_merge([i, obj[i]], args));

                if (value === false)
                {
                    break;
                }
            }
        }
        else
        {
            for (i in obj)
            {
                value = callback.apply(thisArg, array_merge([i, obj[i]], args));

                if (value === false)
                {
                    break;
                }
            }
        }

        // A special, fast, case for the most common use of each
    }
    else
    {
        if (isArray)
        {
            for (; i < length; i++)
            {
                value = callback.call(thisArg, i, obj[i]);

                if (value === false)
                {
                    break;
                }
            }
        }
        else
        {
            for (i in obj)
            {
                value = callback.call(thisArg, i, obj[i]);

                if (value === false)
                {
                    break;
                }
            }
        }
    }

    return obj;
}

/**
 * Map.
 *  
 * return undefined to break loop, true to keep, false to reject
 * 
 * @param   {array|object}  obj
 * @param   {function}      callback
 * @param   {array|mixed}   args      If single arg provided gets apllied as this to callback, otherwise args apllied to callback
 * @returns {array|object}
 */
function map(obj, callback, args)
{
    let arrType = is_array(obj) ? 'array' : 'obj';
    let ret = arrType === 'array' ? [] : {};
    let keys = arrType === 'array' ? Array.from(obj.keys()) : Object.keys(obj);
    let len = keys.length;

    var thisArg = !is_undefined(args) && !is_array(args) ? args : obj;

    // This arg gets set to array/object, unless a single arg is provided...

    if (is_array(args))
    {
        for (let i = 0; i < len; i++)
        {
            let key = keys[i];

            let value = callback.apply(thisArg, array_merge([key, obj[key]], args));

            if (value === false)
            {
                continue;
            }
            else if (typeof value === 'undefined')
            {
                break;
            }
            else
            {
                arrType === 'array' ? ret.push(value) : ret[key] = value;
            }
        }
        // A special, fast, case for the most common use of each
    }
    else
    {
        for (let i = 0; i < len; i++)
        {
            let key = keys[i];

            let value = callback.call(thisArg, key, obj[key]);

            if (value === false)
            {
                continue;
            }
            else if (typeof value === 'undefined')
            {
                break;
            }
            else
            {
                arrType === 'array' ? ret.push(value) : ret[key] = value;
            }
        }
    }

    return ret;
}

const utils_ = {
    is_object,
    is_array,
    is_string,
    is_number,
    is_numeric,
    is_undefined,
    is_null,
    is_bool,
    is_htmlElement,
    is_callable,
    is_constructable,
    is_class,
    is_empty,
    is_equal: utils_is_equal,
    in_dom,
    size,
    bool,
    object_props,
    callable_name,
    triggerEvent,
    obj,
    array_set,
    array_get: utils_array_get,
    array_has,
    array_delete,
    array_filter,
    array_merge,
    dotify,
    cloneDeep,
    mergeDeep,
    foreach,
    map,
};

/* harmony default export */ const utils = (utils_);
;// CONCATENATED MODULE: ./src/vdom/utils.js


/**
 * Checks if Vnode is mounted.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isMounted = (node) =>
{
    return _.in_dom(nodeElem(node));
}

/**
 * Checks if Vnode is fragment.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isFragment = (node) =>
{
    return node.type === 'fragment';
}

/**
 * Checks if Vnode is thunk.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isThunk = (node) =>
{
    return node.type === 'thunk';
}

/**
 * Is functional thunk.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isFunctionalThunk = (node) =>
{
    return node.type === 'thunk' && node.__internals.fn !== null
}

/**
 * Is native Vnode.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isNative = (node) =>
{
    return node.type === 'native';
}

/**
 * Is text Vnode.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isText = (node) =>
{
    return node.type === 'text';
}

/**
 * Is empty Vnode.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isEmpty = (node) =>
{
    return node.type === 'empty';
}

/**
 * Has no children.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let noChildren = (node) =>
{
    return node.children.length === 1 && isEmpty(node.children[0]);
}

/**
 * Has single child.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let singleChild = (node) =>
{
    return node.children.length === 1 && !isEmpty(node.children[0]);
}

/**
 * Are thunks the same.
 *  
 * @param   {object}  left
 * @param   {object}  right
 * @returns {boolean}
 */
let isSameThunk = (left, right) =>
{
    // Functional component
    if (isFunctionalThunk(left) || isFunctionalThunk(right))
    {
        return left.__internals._name === right.__internals._name && left.__internals._fn === right.__internals._fn;
    }

    return left.fn === right.fn && left.__internals._name === right.__internals._name;
}

/**
 * Are fragments the same.
 *  
 * @param   {object}  left
 * @param   {object}  right
 * @returns {boolean}
 */
let isSameFragment = (left, right) =>
{
    return isFragment(left) && isFragment(right) && left.fn === right.fn;
}

/**
 * Is thunk instantiated.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isThunkInstantiated = (vnode) =>
{
    return nodeComponent(vnode) !== null;
}

/**
 * Checks if a thunk Vnode is only nesting a fragment.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
let isNestingFragment = (node) =>
{
    if (isThunk(node) && isThunkInstantiated(node))
    {
        while (node.children && isThunk(node))
        {
            node = node.children[0];
        }

        return isFragment(node);
    }

    return false;
}

/**
 * Thunk function name.
 *  
 * @param   {object}  node
 * @returns {string}
 */
let thunkName = (node) =>
{
    return node.__internals._name;
}

/**
 * Set/get node element.
 *  
 * @param   {object}                   node
 * @param   {HTMLElement | undefined}  Elem 
 * @returns {HTMLElement}
 */
let nodeElem = (node, elem) =>
{
    if (!utils.is_undefined(elem))
    {
        node.__internals._domEl = elem;

        return elem;
    }

    if (isThunk(node) || isFragment(node))
    {
        return findThunkDomEl(node);
    }

    return node.__internals._domEl;
}

/**
 * Set/get native Vnodes attributes.
 *  
 * @param   {object}              node
 * @param   {object | undefined}  attrs 
 * @returns {object}
 */
let nodeAttributes = (node, attrs) =>
{
    if (!utils.is_undefined(attrs))
    {
        node.__internals._prevAttrs = node.attributes;

        node.attributes = attrs;
    }

    return node.attributes;
}

/**
 * Set/get Vnode's component.
 *  
 * @param   {object}              node
 * @param   {object | undefined}  component 
 * @returns {object}
 */
let nodeComponent = (node, component) =>
{
    if (!utils.is_undefined(component))
    {
        node.__internals._component = component;
    }

    return node.__internals._component;
}

/**
 * Set/get component's Vnode.
 *  
 * @param   {object}              component
 * @param   {object | undefined}  node 
 * @returns {object}
 */
let componentNode = (component, node) =>
{
    if (!_.is_undefined(node))
    {
        component.__internals.vnode = node;
    }

    return component.__internals.vnode;
}


/**
 * Returns the parent DOMElement of a given vnNode.
 *  
 * @param   {object}  vnode
 * @returns {HTMLElement}
 */
let parentElem = (vnode) =>
{
    // Native node
    if (isNative(vnode) || isText(vnode) || isEmpty(vnode))
    {
        return nodeElem(node).parentNode;
    }

    // Thunks / fragments with a direct child
    let child = vnode.children[0];

    if (isNative(child) || isText(child) || isEmpty(child))
    {
        return nodeElem(child).parentNode;
    }

    // Recursively traverse down tree until either a DOM node is found
    // or a fragment is found and return it's parent

    while (isThunk(child) || isFragment(child))
    {
        vnode = child;
        child = child.children[0];
    }

    return isFragment(vnode) ? nodeElem(vnode.children[0]).parentNode : nodeElem(vnode).parentNode;
}

/**
 * Returns index of Vnode relative to parent / siblings.
 *  
 * @param   {object}  node
 * @returns {number}
 */
let domIndex = (node) =>
{
    let parentDOMElement = parentElem(node);

    let domSiblings = Array.prototype.slice.call(parentDOMElement.children);

    let thisEl = nodeElem(node);

    thisEl = _.isArray(thisEl) ? thisEl[0] : thisEl;

    let index = 0;

    _.foreach(domSiblings, function(i, siblingEl)
    {
        if (siblingEl === thisEl)
        {
            index = i;

            return false;
        }
    });

    return index;
}

/**
 * Recursively traverse down tree until either a DOM node is found
 * or a fragment is found and return it's children
 *  
 * @param   {object}  node
 * @returns {array|HTMLElement}
 */
function findThunkDomEl(vnode)
{
    if (isNative(vnode) || isText(vnode) || isEmpty(vnode))
    {
        return nodeElem(vnode);
    }

    let child = vnode.children[0];

    while (isThunk(child) || isFragment(child))
    {
        vnode = child;
        child = child.children[0];
    }

    return isFragment(vnode) ?
        utils.map(vnode.children, function(i, child)
        {
            return nodeElem(child);
        }) :
        nodeElem(vnode);
}

/**
 * Points vnode -> component and component -> vndode
 *  
 * @param  {object}  vnode
 * @param  {object}  component
 */
let pointVnodeThunk = (vnode, component) =>
{
    // point vnode -> component
    vnode.__internals._component = component;

    // point component -> vnode
    component.__internals.vnode = vnode;

    // Point vnode.children -> component.props.children
    if (component.props && component.props.children)
    {
        vnode.children = component.props.children;
    }
}

/**
 * Patches right Vnode to left.
 *  
 * @param  {object}  left
 * @param  {object}  right
 */
function patchVnodes(left, right)
{
    utils.foreach(left, function(key, val)
    {
        let rval = right[key];

        if (utils.is_undefined(rval))
        {
            delete left[key];
        }
        else
        {
            left[key] = rval;
        }
    });
}

/**
 * Recursively calls unmount on nested components
 * in a sub tree
 */
let nodeWillUnmount = (vnode) =>
{
    if (isThunk(vnode) || isFragment(vnode))
    {
        let component = nodeComponent(vnode);

        if (component && utils.is_callable(component.componentWillUnmount))
        {
            component.componentWillUnmount();
        }

        if (!noChildren(vnode))
        {
            utils.foreach(vnode.children, function(i, child)
            {
                nodeWillUnmount(child);
            });
        }
    }
    else if (isNative(vnode) && !noChildren(vnode))
    {
        utils.foreach(vnode.children, function(i, child)
        {
            nodeWillUnmount(child);
        });
    }
}

/**
 * Recursively calls "componentDidMount" on nested components
 * in a sub tree.
 */
let nodeDidMount = (vnode) =>
{
    if (isThunk(vnode) || isFragment(vnode))
    {
        let component = nodeComponent(vnode);

        if (component && _.is_callable(component.componentDidMount))
        {
            component.componentDidMount();
        }

        if (!noChildren(vnode))
        {
            _.foreach(vnode.children, function(i, child)
            {
                nodeDidMount(child);
            });
        }
    }
    else if (isNative(vnode) && !noChildren(vnode))
    {
        _.foreach(vnode.children, function(i, child)
        {
            nodeDidMount(child);
        });
    }
}
;// CONCATENATED MODULE: ./src/jsx/Parser.js
function oneObject(str)
{
    var obj = {}
    str.split(",").forEach(_ => obj[_] = true)
    return obj
}
var voidTag = oneObject("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr")
var specalTag = oneObject('xmp,style,script,noscript,textarea,template,#comment')

var hiddenTag = oneObject('style,script,noscript,template')

const Parser = function(a, f)
{
    if (!(this instanceof Parser))
    {
        return parse(a, f)
    }
    this.input = a
    this.getOne = f
}

Parser.prototype = {
    parse: function()
    {
        return parse(this.input, this.getOne)
    }
}
var rsp = /\s/
/**
 * 
 * 
 * @param {any} string 
 * @param {any} getOne 只返回一个节点
 * @returns 
 */
function parse(string, getOne)
{
    getOne = (getOne === void 666 || getOne === true)
    var ret = lexer(string, getOne)
    if (getOne)
    {
        return typeof ret[0] === 'string' ? ret[1] : ret[0]
    }
    return ret
}

function lexer(string, getOne)
{
    var tokens = []
    var breakIndex = 120
    var stack = []
    var origString = string
    var origLength = string.length

    stack.last = function()
    {
        return stack[stack.length - 1]
    }
    var ret = []

    function addNode(node)
    {
        var p = stack.last()
        if (p && p.children)
        {
            p.children.push(node)
        }
        else
        {
            ret.push(node)
        }
    }

    var lastNode
    do {
        if (--breakIndex === 0)
        {
            break
        }
        var arr = getCloseTag(string)

        if (arr)
        { //处理关闭标签
            string = string.replace(arr[0], '')
            const node = stack.pop()
            //处理下面两种特殊情况：
            //1. option会自动移除元素节点，将它们的nodeValue组成新的文本节点
            //2. table会将没有被thead, tbody, tfoot包起来的tr或文本节点，收集到一个新的tbody元素中
            if (node.type === 'option')
            {
                node.children = [
                {
                    type: '#text',
                    nodeValue: getText(node)
                }]
            }
            else if (node.type === 'table')
            {
                insertTbody(node.children)
            }
            lastNode = null
            if (getOne && ret.length === 1 && !stack.length)
            {
                return [origString.slice(0, origLength - string.length), ret[0]]
            }
            continue
        }

        var arr = getOpenTag(string)
        if (arr)
        {
            string = string.replace(arr[0], '')
            var node = arr[1]
            addNode(node)
            var selfClose = !!(node.isVoidTag || specalTag[node.type])
            if (!selfClose)
            { //放到这里可以添加孩子
                stack.push(node)
            }
            if (getOne && selfClose && !stack.length)
            {
                return [origString.slice(0, origLength - string.length), node]
            }
            lastNode = node
            continue
        }

        var text = ''
        do {
            //处理<div><<<<<<div>的情况
            const index = string.indexOf('<')
            if (index === 0)
            {
                text += string.slice(0, 1)
                string = string.slice(1)

            }
            else
            {
                break
            }
        } while (string.length);
        //处理<div>{aaa}</div>,<div>xxx{aaa}xxx</div>,<div>xxx</div>{aaa}sss的情况
        const index = string.indexOf('<') //判定它后面是否存在标签
        const bindex = string.indexOf('{') //判定它后面是否存在jsx
        const aindex = string.indexOf('}')

        let hasJSX = (bindex < aindex) && (index === -1 || bindex < index)
        if (hasJSX)
        {
            if (bindex !== 0)
            { // 收集jsx之前的文本节点
                text += string.slice(0, bindex)
                string = string.slice(bindex)
            }
            addText(lastNode, text, addNode)
            string = string.slice(1) //去掉前面{
            var arr = parseCode(string)
            addNode(makeJSX(arr[1]))
            lastNode = false
            string = string.slice(arr[0].length + 1) //去掉后面的}
        }
        else
        {
            if (index === -1)
            {
                text = string
                string = ''
            }
            else
            {
                text += string.slice(0, index)
                string = string.slice(index)
            }
            addText(lastNode, text, addNode)
        }

    } while (string.length);
    return ret
}


function addText(lastNode, text, addNode)
{
    if (/\S/.test(text))
    {
        if (lastNode && lastNode.type === '#text')
        {
            lastNode.text += text
        }
        else
        {
            lastNode = {
                type: '#text',
                nodeValue: text
            }
            addNode(lastNode)
        }
    }
}

//它用于解析{}中的内容，如果遇到不匹配的}则返回, 根据标签切割里面的内容 
function parseCode(string)
{ // <div id={ function(){<div/>} }>
    var word = '', //用于匹配前面的单词
        braceIndex = 1,
        codeIndex = 0,
        nodes = [],
        quote,
        escape = false,
        state = 'code'
    for (var i = 0, n = string.length; i < n; i++)
    {
        var c = string.charAt(i),
            next = string.charAt(i + 1)
        switch (state)
        {
            case 'code':
                if (c === '"' || c === "'")
                {
                    state = 'string'
                    quote = c
                }
                else if (c === '{')
                {
                    braceIndex++
                }
                else if (c === '}')
                {
                    braceIndex--
                    if (braceIndex === 0)
                    {
                        collectJSX(string, codeIndex, i, nodes)
                        return [string.slice(0, i), nodes]
                    }
                }
                else if (c === '<')
                {
                    var word = '',
                        empty = true,
                        index = i - 1
                    do {
                        c = string.charAt(index)
                        if (empty && rsp.test(c))
                        {
                            continue
                        }
                        if (rsp.test(c))
                        {
                            break
                        }
                        empty = false
                        word = c + word
                        if (word.length > 7)
                        { //性能优化
                            break
                        }
                    } while (--index >= 0);
                    var chunkString = string.slice(i)
                    if (word === '' || /(=>|return|\{|\(|\[|\,)$/.test(word) && /\<\w/.test(chunkString))
                    {
                        collectJSX(string, codeIndex, i, nodes)
                        var chunk = lexer(chunkString, true)
                        nodes.push(chunk[1])
                        i += (chunk[0].length - 1) //因为已经包含了<, 需要减1
                        codeIndex = i + 1
                    }

                }
                break
            case 'string':
                if (c == '\\' && (next === '"' || next === "'"))
                {
                    escape = !escape
                }
                else if (c === quote && !escape)
                {
                    state = 'code'
                }
                break
        }

    }
}

function collectJSX(string, codeIndex, i, nodes)
{
    var nodeValue = string.slice(codeIndex, i)
    if (/\S/.test(nodeValue))
    { //将{前面的东西放进去
        nodes.push(
        {
            type: '#jsx',
            nodeValue: nodeValue
        })
    }
}

var rtbody = /^(tbody|thead|tfoot)$/

function insertTbody(nodes)
{
    var tbody = false
    for (var i = 0, n = nodes.length; i < n; i++)
    {
        var node = nodes[i]
        if (rtbody.test(node.nodeName))
        {
            tbody = false
            continue
        }

        if (node.nodeName === 'tr')
        {
            if (tbody)
            {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            }
            else
            {
                tbody = {
                    nodeName: 'tbody',
                    props: {},
                    children: [node]
                }
                nodes.splice(i, 1, tbody)
            }
        }
        else
        {
            if (tbody)
            {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            }
        }
    }
}


function getCloseTag(string)
{
    if (string.indexOf("</") === 0)
    {
        var match = string.match(/\<\/(\w+)>/)
        if (match)
        {
            var tag = match[1]
            string = string.slice(3 + tag.length)
            return [match[0],
            {
                type: tag
            }]
        }
    }
    return null
}

function getOpenTag(string)
{
    if (string.indexOf("<") === 0)
    {
        var i = string.indexOf('<!--') //处理注释节点
        if (i === 0)
        {
            var l = string.indexOf('-->')
            if (l === -1)
            {
                thow('注释节点没有闭合 ' + string.slice(0, 100))
            }
            var node = {
                type: '#comment',
                nodeValue: string.slice(4, l)
            }

            return [string.slice(0, l + 3), node]
        }
        var match = string.match(/\<(\w[^\s\/\>]*)/) //处理元素节点
        if (match)
        {
            var leftContent = match[0],
                tag = match[1]
            var node = {
                type: tag,
                props: {},
                children: []
            }

            string = string.replace(leftContent, '') //去掉标签名(rightContent)
            var arr = getAttrs(string) //处理属性
            if (arr)
            {
                node.props = arr[1]
                string = string.replace(arr[0], '')
                leftContent += arr[0]
            }

            if (string[0] === '>')
            { //处理开标签的边界符
                leftContent += '>'
                string = string.slice(1)
                if (voidTag[node.type])
                {
                    node.isVoidTag = true
                }
            }
            else if (string.slice(0, 2) === '/>')
            { //处理开标签的边界符
                leftContent += '/>'
                string = string.slice(2)
                node.isVoidTag = true
            }

            if (!node.isVoidTag && specalTag[tag])
            { //如果是script, style, xmp等元素
                var closeTag = '</' + tag + '>'
                var j = string.indexOf(closeTag)
                var nodeValue = string.slice(0, j)
                leftContent += nodeValue + closeTag
                node.children.push(
                {
                    type: '#text',
                    nodeValue: nodeValue
                })
            }

            return [leftContent, node]
        }
    }
}

function getText(node)
{
    var ret = ''
    node.children.forEach(function(el)
    {
        if (el.type === '#text')
        {
            ret += el.nodeValue
        }
        else if (el.children && !hiddenTag[el.type])
        {
            ret += getText(el)
        }
    })
    return ret
}

function getAttrs(string)
{
    var state = 'AttrNameOrJSX',
        attrName = '',
        attrValue = '',
        quote,
        escape,
        props = {}

    for (var i = 0, n = string.length; i < n; i++)
    {
        var c = string[i]
        switch (state)
        {
            case 'AttrNameOrJSX':
                if (c === '/' || c === '>')
                {
                    return [string.slice(0, i), props]
                }
                if (rsp.test(c))
                {
                    if (attrName)
                    {
                        state = 'AttrEqual'
                    }
                }
                else if (c === '=')
                {
                    if (!attrName)
                    {
                        throw '必须指定属性名'
                    }
                    state = 'AttrQuoteOrJSX'
                }
                else if (c === '{')
                {
                    state = 'SpreadJSX'
                }
                else
                {
                    attrName += c
                }
                break
            case 'AttrEqual':
                if (c === '=')
                {
                    state = 'AttrQuoteOrJSX'
                }
                break
            case 'AttrQuoteOrJSX':
                if (c === '"' || c === "'")
                {
                    quote = c
                    state = 'AttrValue'
                    escape = false
                }
                else if (c === '{')
                {
                    state = 'JSX'
                }
                break
            case 'AttrValue':
                if (c === '\\')
                {
                    escape = !escape
                }
                if (c !== quote)
                {
                    attrValue += c
                }
                else if (c === quote && !escape)
                {
                    props[attrName] = attrValue
                    attrName = attrValue = ''
                    state = 'AttrNameOrJSX'
                }
                break
            case 'SpreadJSX':
                i += 3
            case 'JSX':

                var arr = parseCode(string.slice(i))
                i += arr[0].length

                props[state === 'SpreadJSX' ? 'spreadAttribute' : attrName] = makeJSX(arr[1])
                attrName = attrValue = ''
                state = 'AttrNameOrJSX'
                break
        }
    }
    throw '必须关闭标签'
}

function makeJSX(JSXNode)
{
    return JSXNode.length === 1 && JSXNode[0].type === '#jsx' ? JSXNode[0] : { type: '#jsx', nodeValue: JSXNode }
}

/* harmony default export */ const jsx_Parser = (Parser);
;// CONCATENATED MODULE: ./src/jsx/error.js
class JsxSyntaxError extends Error
{
    constructor(error)
    {
        super('JSX syntax error');

        this.name = 'JsxSyntaxError';

        console.error(error);
    }
}
;// CONCATENATED MODULE: ./src/jsx/evaluate.js






const R_COMPONENT = /^(this|[A-Z])/;
const CACHE_FNS = {};
const CACHE_STR = {};
const COMPONENT_CACHE = {};


function evaluate(str, obj, config)
{
    var jsx = new innerClass(str, config);

    var output = jsx.init();

    obj = genDepencies(obj);

    var args = 'var args0 = arguments[0];';

    for (var i in obj)
    {
        if (i !== 'this')
        {
            args += 'var ' + i + ' = args0["' + i + '"];';
        }
    }

    args += 'return ' + output;

    try
    {
        var fn;

        if (CACHE_FNS[args])
        {
            fn = CACHE_FNS[args]
        }
        else
        {
            fn = CACHE_FNS[args] = Function(args)
        }

        var a = fn.call(obj.this, obj)

        return a;
    }
    catch (e)
    {
        throw new JsxSyntaxError(e);
    }
}

function genDepencies(obj)
{
    obj = !obj ? {} : obj;

    obj.Reactifly = { createElement: createElement };
    obj.Fragment = Fragment;

    for (let key in COMPONENT_CACHE)
    {
        obj[key] = COMPONENT_CACHE[key];
    }

    let hasProps = typeof obj.props !== 'undefined' || (obj['this'] && obj['this'].props);

    if (!hasProps && RENDER_QUEUE.current && RENDER_QUEUE.current.props )
    {
        obj.props = RENDER_QUEUE.current.props;
    }

    return obj;
}

function innerClass(str, config)
{
    config = config || {};
    config.ns = 'Reactifly';
    this.input = str;
    this.ns = config.ns
    this.type = config.type
}

innerClass.prototype = {
    init: function()
    {
        if (typeof jsx_Parser === 'function')
        {
            var useCache = this.input.length < 720
            if (useCache && CACHE_STR[this.input])
            {
                return CACHE_STR[this.input]
            }
            var array = (new jsx_Parser(this.input)).parse();

            var evalString = this.genChildren([array])
            if (useCache)
            {
                return CACHE_STR[this.input] = evalString
            }
            return evalString
        }
        else
        {
            throw 'need Parser https://github.com/RubyLouvre/jsx-parser'
        }
    },
    genTag: function(el)
    {
        var children = this.genChildren(el.children, el);
        var ns = this.ns;
        var type = R_COMPONENT.test(el.type) ? el.type : JSON.stringify(el.type);

        return ns + '.createElement(' + type +
            ',' + this.genProps(el.props, el) +
            ',' + children + ')'
    },
    genProps: function(props, el)
    {
        if (!props && !el.spreadAttribute)
        {
            return 'null';
        }

        var ret = '{';

        for (var i in props)
        {
            ret += JSON.stringify(i) + ':' + this.genPropValue(props[i]) + ',\n';
        }

        ret = ret.replace(/\,\n$/, '') + '}';

        if (el.spreadAttribute)
        {
            return 'Object.assign({},' + el.spreadAttribute + ',' + ret + ')';
        }

        return ret;
    },
    genPropValue: function(val)
    {
        if (typeof val === 'string')
        {
            return JSON.stringify(val)
        }
        if (val)
        {
            if (Array.isArray(val.nodeValue))
            {
                return this.genChildren(val.nodeValue)
            }
            if (val)
            {
                return val.nodeValue
            }
        }
    },
    genChildren: function(children, obj, join)
    {
        if (obj)
        {

            if (obj.isVoidTag || !obj.children.length)
            {
                return 'null'
            }
        }

        var ret = [];

        for (var i = 0, el; el = children[i++];)
        {
            if (el.type === '#jsx')
            {
                if (Array.isArray(el.nodeValue))
                {
                    ret[ret.length] = this.genChildren(el.nodeValue, null, ' ')
                }
                else
                {
                    ret[ret.length] = el.nodeValue
                }
            }
            else if (el.type === '#text')
            {
                ret[ret.length] = JSON.stringify(el.nodeValue)
            }
            else if (el)
            {
                ret[ret.length] = this.genTag(el)
            }
        }

        return ret.join(join || ',')
    }
};
;// CONCATENATED MODULE: ./src/jsx/index.js



function parseJSX(jsx, obj, config)
{
    return evaluate(jsx, obj, config);
}

function jsx(str, vars)
{
    if (!is_undefined(vars) && !is_object(vars))
    {
        throw new Error('Variables should be supplied to [jsx] as an object e.g [jsx("<div class={name} />", {name: "foo"})]');
    }

    return evaluate(str, vars);
}

function register(component, key)
{
    key = is_undefined(key) ? callable_name(component) : key;

    COMPONENT_CACHE[key] = component;
}
;// CONCATENATED MODULE: ./src/compat/Component.js




/**
 * Base component
 * 
 * static getDerivedStateFromProps()
 * componentDidMount()
 * componentWillUnmount()
 * componentWillReceiveProps(nextProps)
 * getSnapshotBeforeUpdate(prevProps, prevState)
 * shouldComponentUpdate(nextProps, nextState)
 * componentWillUpdate(changedProps, changedState)
 * componentDidUpdate(prevProps, prevState, snapshot)
 * componentDidCatch()
 * @class
 */
class Component
{
    /**
     * Context.
     *
     * @var {object}
     */
    context = {};

    /**
     * props.
     *
     * @var {object}
     */
    props = {};

    /**
     * Reference to DOM node.
     *
     * @var {object}
     */
    refs = {};

    /**
     * State obj
     *
     * @var {object}
     */
    state = {};

    /**
     * Default props.
     *
     * @var {object}
     */
    defaultProps = {};

    /**
     * Internal use
     *
     * @var {object}
     */
    __internals = {
        vnode: null,
        prevState: {},
        prevProps: {},
    };

    /**
     * Constructor
     *
     */
    constructor(props)
    {
        this.props = !utils.is_object(props) ? {} : props;
    }

    setState(key, value, callback)
    {
        if (!utils.is_object(this.state))
        {
            this.state = {};
        }

        let stateChanges = {};

        // setState({ 'foo.bar' : 'foo' })
        if (arguments.length === 1)
        {
            if (!utils.is_object(key))
            {
                throw new Error('StateError: State should be an object with [dot.notation] keys. e.g. [setState({"foo.bar" : "baz"})]');
            }

            stateChanges = key;
        }
        else
        {
            stateChanges[key] = value;
        }

        this.__internals.prevState = utils.cloneDeep(this.state);

        utils.foreach(stateChanges, function(key, value)
        {
            utils.array_set(key, value, this.state);

        }, this);

        if (!utils.is_equal(this.state, this.__internals.prevState))
        {
            thunkUpdate(this.__internals.vnode);
        }
    }

    getState(key)
    {
        return array_get(key, this.state);
    }

    jsx(jsx)
    {
        const context = renderContext(this);

        return parseJSX(jsx, { ...context, this: this });
    }

    forceUpdate()
    {
        thunkUpdate(this.__internals.vnode);
    }
}
;// CONCATENATED MODULE: ./src/compat/Fragment.js


/**
 * Fragment component
 * 
 * @class
 */
class Fragment extends Component
{
    constructor(props)
    {
        super(props);
    }
}
;// CONCATENATED MODULE: ./src/compat/hooks.js
/*
Copyright 2018-2019 a1pack

https://codesandbox.io/s/mnox05qp8?file=/src/index.js:0-7779

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/




const RENDER_QUEUE = {
    current: null
};

let HOOK_CONTEXT;

function useEffect(effect, deps)
{
    const i = HOOK_CONTEXT.hookIndex++;

    if (!HOOK_CONTEXT.hooks[i])
    {
        HOOK_CONTEXT.hooks[i] = effect;
        HOOK_CONTEXT.hookDeps[i] = deps;
        HOOK_CONTEXT.hooksCleanups[i] = effect();
    }
    else
    {
        if (deps && !is_equal(deps, HOOK_CONTEXT.hookDeps[i]))
        {
            if (HOOK_CONTEXT.hooksCleanups[i])
            {
                HOOK_CONTEXT.hooksCleanups[i]();
            }

            HOOK_CONTEXT.hooksCleanups[i] = effect();
        }
    }
}

function useRef(initialValue)
{
    return useCallback(refHolderFactory(initialValue), []);
}

function refHolderFactory(reference)
{
    function RefHolder(ref)
    {
        reference = ref;
    }

    Object.defineProperty(RefHolder, "current",
    {
        get: () => reference,
        enumerable: true,
        configurable: true
    });

    return RefHolder;
}

function useLayoutEffect(effect, deps)
{
    const i = HOOK_CONTEXT.hookIndex++;

    const thisHookContext = HOOK_CONTEXT;

    useEffect(() =>
    {
        thisHookContext.layoutEffects[i] = () =>
        {
            thisHookContext.hooksCleanups[i] = effect();
        };

    }, deps);
}

function useReducer(reducer, initialState, initialAction)
{
    const i = HOOK_CONTEXT.hookIndex++;

    if (!HOOK_CONTEXT.hooks[i])
    {
        HOOK_CONTEXT.hooks[i] = {
            state: initialAction ? reducer(initialState, initialAction) : initialState
        };
    }

    const thisHookContext = HOOK_CONTEXT;

    return [
        HOOK_CONTEXT.hooks[i].state,
        useCallback(action =>
        {
            thisHookContext.hooks[i].state = reducer(thisHookContext.hooks[i].state, action);

            thisHookContext.setState();
        }, [])
    ];
}

function useState(initial)
{
    const i = RENDER_QUEUE.current.hookIndex++;

    if (!RENDER_QUEUE.current.hooks[i])
    {
        RENDER_QUEUE.current.hooks[i] = {
            state: transformState(initial)
        };
    }

    const thisHookContext = RENDER_QUEUE.current;

    return [

        RENDER_QUEUE.current.hooks[i].state,

        useCallback(newState =>
        {
            thisHookContext.hooks[i].state = transformState(newState, thisHookContext.hooks[i].state);

            thisHookContext.forceUpdate();

        }, [])
    ];
}

function useCallback(cb, deps)
{
    return useMemo(() => cb, deps);
}

function useMemo(factory, deps)
{
    const i = RENDER_QUEUE.current.hookIndex++;
    if (
        !RENDER_QUEUE.current.hooks[i] ||
        !deps ||
        !utils_is_equal(deps, RENDER_QUEUE.current.hookDeps[i])
    )
    {
        RENDER_QUEUE.current.hooks[i] = factory();
        RENDER_QUEUE.current.hookDeps[i] = deps;
    }

    return RENDER_QUEUE.current.hooks[i];
}

// end public api

function transformState(state, prevState)
{
    if (typeof state === "function")
    {
        return state(prevState);
    }

    return state;
}

// end HOOKS
;// CONCATENATED MODULE: ./src/compat/functionalComponent.js



class FunctionalComponent extends Component
{
    hookIndex;
    hooks = [];
    hooksCleanups = [];
    hookDeps = [];
    layoutEffects = [];

    constructor(render, props)
    {
        super(props);

        this.__internals._fn = render;
    }

    componentDidMount()
    {
        for (let i = 0; i < this.hooks.length; ++i)
        {
            const effect = this.layoutEffects[i];

            if (effect)
            {
                try
                {
                    effect();
                }
                catch (e) {}
            }
        }

        this.layoutEffects = [];
    }

    componentDidUpdate()
    {
        for (let i = 0; i < this.hooks.length; ++i)
        {
            const effect = this.layoutEffects[i];

            if (effect)
            {
                try
                {
                    effect();
                }
                catch (e) {}
            }
        }

        this.layoutEffects = [];
    }

    componentWillUnmount()
    {
        for (let i = 0; i < this.hooks.length; ++i)
        {
            const cleanup = this.hooksCleanups[i];

            if (cleanup)
            {
                try
                {
                    cleanup();
                }
                catch (e) {}
            }
        }
    }

    render()
    {
        const prevContext = RENDER_QUEUE.current;

        try
        {
            RENDER_QUEUE.current = this;

            this.hookIndex = 0;

            return this.__internals._fn(this.props);
        }
        finally
        {
            RENDER_QUEUE.current = prevContext;
        }
    }
}

/**
 * Functional component callback
 * 
 * @class
 */
function functionalComponent(fn)
{
    const factory = function(props)
    {
        let component = new FunctionalComponent(fn, props);

        return component;
    }

    return factory;
}
;// CONCATENATED MODULE: ./src/compat/index.js




;// CONCATENATED MODULE: ./src/vdom/element.js




/**
 * JSX create element.
 *  
 * @param   {string | function}   tag         Root html element
 * @param   {object | undefined}  props       Tag props / attributes
 * @param   {array | undefined}  ...children  Tag children (recursive)
 * @returns {object}
 */
function createElement(tag, props, ...children)
{
    if (arguments.length === 0)
    {
        return createEmptyVnode();
    }

    let normalizedProps = {},
        key,
        ref,
        i;

    for (i in props)
    {
        if (i == 'key')
        {
            key = props[i];
        }
        else if (i == 'ref')
        {
            ref = props[i];
        }
        else
        {
            normalizedProps[i] = props[i];
        }
    }

    children = typeof children === 'undefined' ? [] : children;

    if (arguments.length > 2)
    {
        children = arguments.length > 3 ? [].slice.call(arguments, 2) : children;
    }

    children = normaliseChildren(children);

    // If a Component VNode, check for and apply defaultProps
    // Note: type may be undefined in development, must never error here.
    if (utils.is_callable(tag) && utils.is_object(tag.defaultProps))
    {
        for (i in tag.defaultProps)
        {
            if (utils.is_undefined(normalizedProps[i]))
            {
                normalizedProps[i] = tag.defaultProps[i];
            }
        }
    }

    if (typeof tag === 'function')
    {
        if (!utils.is_constructable(tag))
        {
            return createFunctionalThunk(tag, normalizedProps, children, key, ref);
        }

        return createThunkVnode(tag, normalizedProps, children, key, ref);
    }

    return {
        type: 'native',
        tagName: tag,
        attributes: normalizedProps,
        children,
        ref,
        key,
        __internals:
        {
            _domEl: null,
            _prevAttrs: ''
        }
    }
}

/**
 * Cleans up the array of child elements.
 * 
 * - Flattens nested arrays
 * - Flattens nested fragments
 * - Converts raw strings and numbers into vnodes
 * - Filters out undefined elements
 *  
 * @param   {array}                children   Child vnodes
 * @param   {boolean | undefined}  checkKeys  Check keys on child when a fragment is found
 * @returns {array}
 */
function normaliseChildren(children, checkKeys)
{
    checkKeys = utils.is_undefined(checkKeys) ? false : checkKeys;

    let fragmentcount = 0;

    var ret = [];

    if (utils.is_array(children))
    {
        utils.foreach(children, function(i, vnode)
        {
            if (utils.is_null(vnode) || utils.is_undefined(vnode))
            {
                ret.push(createEmptyVnode());
            }
            else if (checkKeys && !vnode.key)
            {
                throw new Error('Each child in a list should have a unique "key" prop.')
            }
            else if (utils.is_string(vnode) || utils.is_number(vnode))
            {
                ret.push(createTextVnode(vnode, null));
            }
            else if (utils.is_array(vnode))
            {
                let _children = normaliseChildren(vnode, true);

                utils.array_merge(ret, _children);
            }
            else if (isFragment(vnode))
            {
                squashFragment(vnode, ret, fragmentcount);

                fragmentcount++;
            }
            else
            {
                ret.push(vnode);
            }
        });
    }

    return utils.is_empty(ret) ? [createEmptyVnode()] : filterChildren(ret);
}

/**
 * Squashes a fragment into stack and applies special fragment keys to it.
 *  
 * @param {object}  fragment  Fragment Vnode
 * @param {array}   ret       Return array to modify
 * @param {number}  fCount    Number of direct fragment childs in parent
 */
function squashFragment(fragment, ret, fCount)
{
    let basekey = !fragment.key ? `f_${fCount}` : fragment.key;

    let _children = normaliseChildren(fragment.children, false);

    utils.foreach(_children, function(i, vnode)
    {
        vnode.key = `${basekey}|${i}`;
    });

    utils.array_merge(ret, _children);
}

/**
 * If a node comprises of multiple empty children, filter
 * children and return only a single "empty" child
 */

/**
 * Ensures we return only a single empty Vnode child (instead of multiple) when
 * children are empty
 *  
 * @param   {array}  children  Child Vnodes
 * @returns {array}
 */
function filterChildren(children)
{
    // Empty
    let ret = [children[0]];

    utils.foreach(children, function(i, vnode)
    {
        if (!isEmpty(vnode))
        {
            ret = children;

            return false;
        }
    });

    return ret;
}

/**
 * Creates text Vnode.
 *  
 * @param   {string}              text Node text 
 * @param   {string | undefined}  key  Node key   
 * @returns {object}
 */
function createTextVnode(text, key)
{
    text = utils.is_string(text) ? text : text + '';

    return {
        type: 'text',
        nodeValue: text + '',
        key: key,
        __internals:
        {
            _domEl: null
        }
    }
}

/**
 * Creates empty Vnode.
 * 
 * @returns {object}
 */
function createEmptyVnode()
{
    return {
        type: 'empty',
        key: null,
        __internals:
        {
            _domEl: null
        }
    }
}

/**
 * Creates thunk Vnode with component class.
 * 
 * @param   {function}            fn        Component function
 * @param   {object}              props     Component props
 * @param   {array}               children  Vnode children
 * @param   {string | undefined}  key       Node key
 * @param   {object | undefined}  ref       Node ref   
 * @returns {object}
 */
function createThunkVnode(fn, props, children, key, ref)
{
    let _type = utils.is_class(fn, 'Fragment') ? 'fragment' : 'thunk';

    return {
        type: _type,
        fn,
        children,
        props,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name: utils.callable_name(fn),
            _fn: null,
        }
    }
}

/**
 * Creates thunk Vnode with function.
 * 
 * @param   {function}            fn        Component function
 * @param   {object}              props     Component props
 * @param   {array}               children  Vnode children
 * @param   {string | undefined}  key       Node key
 * @param   {object | undefined}  ref       Node ref   
 * @returns {object}
 */
function createFunctionalThunk(fn, props, children, key, ref)
{
    let func = functionalComponent(fn);

    return {
        type: 'thunk',
        fn: func,
        children: null,
        props,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name: utils.callable_name(fn),
            _fn: fn,
        }
    }
}

/* harmony default export */ const vdom_element = ((/* unused pure expression or super */ null && (createElement)));
;// CONCATENATED MODULE: ./src/vdom/patch.js





/**
 * Patch previous/next render Vnodes (Recursive).
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patch(left, right, actions)
{
    actions = utils.is_undefined(actions) ? [] : actions;

    // Same nothing to do
    if (left === right)
    {
        // nothing to do
    }
    else if (left.type !== right.type)
    {
        replaceNode(left, right, actions);
    }
    else if (isNative(right))
    {
        patchNative(left, right, actions);
    }
    else if (isText(right))
    {
        patchText(left, right, actions);
    }
    else if (isThunk(right))
    {
        patchThunk(left, right, actions);
    }
    else if (isFragment(right))
    {
        patchFragment(left, right, actions);
    }
    else if (isEmpty(right))
    {
        replaceNode(left, right, actions);
    }
}

/**
 * Patch text Vnode.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchText(left, right, actions)
{
    if (right.nodeValue !== left.nodeValue)
    {
        let text = right.nodeValue.slice();

        actions.push(action('replaceText', [left, text]));
    }
}

/**
 * Replace Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function replaceNode(left, right, actions)
{
    if (isThunk(right))
    {
        if (isThunkInstantiated(right))
        {
            throw new Error('Thunk should not be instantiated.');
        }
        else
        {
            let component = thunkInstantiate(right);

            pointVnodeThunk(vnode, component);
        }
    }

    actions.push(action('replaceNode', [left, right]));
}

/**
 * Patch native Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchNative(left, right, actions)
{
    if (left.tagName !== right.tagName)
    {
        actions.push(action('replaceNode', [left, right]));
    }
    else
    {
        diffAttributes(left, right, actions);

        patchChildren(left, right, actions);
    }
}

/**
 * Patch thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchThunk(left, right, actions)
{
    // Same component 
    if (isSameThunk(left, right))
    {
        patchThunkProps(left, right.props);

        diffThunk(left, right, actions);
    }
    // Different components
    else
    {
        let component = thunkInstantiate(right);

        pointVnodeThunk(right, component);

        actions.push(action('replaceNode', [left, right]));
    }
}

/**
 * Patch thunk props.
 * 
 * @param {object}  vnode
 * @param {object}  newProps
 */
function patchThunkProps(vnode, newProps)
{
    let component = nodeComponent(vnode);

    component.__internals.prevProps = utils.cloneDeep(vnode.props);

    component.props = newProps;

    vnode.props = newProps;
}

/**
 * Diff thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffThunk(left, right, actions)
{
    let component = nodeComponent(left);
    let rightchild = thunkRender(component);
    right.children = [rightchild];

    patchChildren(left, right, actions);
}

/**
 * Patch fragment Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchFragment(left, right, actions)
{
    patchChildren(left, right, actions);
}

/**
 * Patch Vnode children.
 * 
 * This is a less expensive pre-patch before diffing is needed if possible
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchChildren(left, right, actions)
{
    let lChildren = left.children;
    let rChildren = right.children;

    // Quick check
    if (noChildren(left) && noChildren(right))
    {
        return;
    }

    // We're only adding new children
    if (noChildren(left))
    {
        // Clear the children now
        left.children = [];

        // Only need to add a single child
        if (singleChild(right))
        {
            actions.push(action('appendChild', [left, rChildren[0]]));
        }

        // We're adding multiple new children
        else if (!noChildren(right))
        {
            utils.foreach(rChildren, function(i, child)
            {
                actions.push(action('appendChild', [left, child]));
            });
        }
    }
    // There's only a single child in previous tree
    else if (singleChild(left))
    {
        // Both have a single node
        if (singleChild(right))
        {
            // left and right could be the same / different type, so we need to patch them
            patch(lChildren[0], rChildren[0], actions);
        }
        // We're only removing the left node, nothing to insert
        else if (noChildren(right))
        {
            // Replace empty with empty
            actions.push(action('replaceNode', [lChildren[0], rChildren[0]]));
        }
        // There's a single child getting replaced with multiple
        else
        {
            // Keys and positions haven't changed
            if (lChildren[0].key === rChildren[0].key)
            {
                patch(lChildren[0], rChildren[0], actions);

                utils.foreach(rChildren, function(i, child)
                {
                    if (i > 0)
                    {
                        actions.push(action('appendChild', [left, child]));
                    }
                });
            }
            else
            {
                patchSingleToMultiChildren(left, right, lChildren[0], rChildren, actions);
            }
        }
    }
    // Previous tree has multiple children
    else
    {
        // Removing all children except one
        if (singleChild(right))
        {
            let matchedKey = false;

            utils.foreach(lChildren, function(i, lChild)
            {
                if (lChild.key === rChildren[0].key)
                {
                    patch(lChild, rChildren[0], actions);

                    matchedKey = true;
                }
                else
                {
                    actions.push(action('removeChild', [left, lChild]));
                }
            });

            if (!matchedKey)
            {
                actions.push(action('appendChild', [left, rChildren[0]]));
            }
        }
        // We're only removing children
        else if (noChildren(right))
        {
            // When there are no child nodes in the new children
            utils.foreach(left.children, function(i, child)
            {
                actions.push(action('removeChild', [left, child]));
            });

            // Append empty child
            actions.push(action('appendChild', [left, right.children[0]]));

        }
        // Both have multiple children, patch the difference
        else
        {
            diffChildren(left, right, actions);
        }
    }
}

/**
 * Patch single to multiple children
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {object}  lChild
 * @param {array}   rChildren
 * @param {array}   actions
 */
function patchSingleToMultiChildren(left, right, lChild, rChildren, actions)
{
    // We need to compare keys and check if one
    let lKey = lChild.key;
    let rChild = null;
    let newIndex = 0;

    // Append remaining children
    utils.foreach(rChildren, function(i, child)
    {
        // If a key was matched but the child has moved index we need to move
        // and patch after appending all the new children
        if (child.key === lKey)
        {
            // If the child has moved index, we should move and patch it after
            if (i !== 0)
            {
                rChild = child;
                newIndex = i;
            }
            // Otherwise we just patch it now
            else
            {
                patch(lChild, child, actions);
            }
        }
        else
        {
            actions.push(action('appendChild', [left, child]));
        }
    });

    // The old key doesn't exist
    if (rChild)
    {
        actions.push(action('moveToIndex', [left, lChild, newIndex]));

        patch(lChild, rChild, actions);
    }
}

/**
 * Diff children.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffChildren(left, right, actions)
{
    let lGroup = groupByKey(left.children);
    let rGroup = groupByKey(right.children);
    let actionsStartIndex = actions.length > 0 ? actions.length : 0;
    let subActions = [];
    let inserted = 0;

    // Note we should still patch indivdual children etc.. but check keys

    // Special case if keys are exactly the same we can just patch each child
    let lKeys = Object.keys(lGroup);
    let rKeys = Object.keys(rGroup);

    if (utils.is_equal(lKeys, rKeys))
    {
        utils.foreach(right.children, function(i, rChild)
        {
            patch(left.children[i], rChild, actions);
        });

        return;
    }

    // Loop right children
    // Note insertAtIndex & removeChild to be executed before moveToIndex
    // otherwise moveToIndex will be incorrect

    // Also when moving multiple indexes, if a move has moves that run after it
    // that are being moved from before it to after it, that index will be incorrect
    // as the prior nodes have not been moved yet
    utils.foreach(rGroup, function(_key, entry)
    {
        let rIndex = entry.index;
        let rChild = entry.child;
        let lEntry = lGroup[_key];

        // New node either by key or > index
        if (utils.is_undefined(lEntry))
        {
            let _insert = rIndex >= lKeys.length ? action('appendChild', [left, rChild]) : action('insertAtIndex', [left, rChild, rIndex]);

            if (!inserted)
            {
                subActions.unshift(_insert);
            }
            else
            {
                subActions.splice(inserted, 0, _insert);
            }

            inserted++;
        }
        // Same key, check index
        else
        {
            delete lGroup[_key];

            let lChild = lEntry.child;

            // Different indexes
            // move then patch
            if (lEntry.index !== rIndex)
            {
                subActions.push(action('moveToIndex', [left, lChild, rIndex]));

                patch(lChild, rChild, actions);
            }
            // Unmoved / patch
            else
            {
                patch(lChild, rChild, actions);
            }
        }
    });

    // We need to remove children last so moving to index works
    if (!utils.is_empty(lGroup))
    {
        utils.foreach(lGroup, function(i, entry)
        {
            subActions.unshift(action('removeChild', [left, entry.child]));
        });
    }

    if (!utils.is_empty(subActions))
    {
        utils.foreach(subActions, function(i, action)
        {
            actions.splice(actionsStartIndex, 0, action);

            actionsStartIndex++;
        });
    }
}

// We need to key thunks by name / count here
// so they get patched rather than remounted

function groupByKey(children)
{
    let ret = {};
    let thunks = {};

    utils.foreach(children, function(i, child)
    {
        let { key } = child;

        // This stop thunks from reinstating when they don't need to
        if (isThunk(child) && !key)
        {
            let name = thunkName(child);

            if (!utils.is_undefined(thunks[name]))
            {
                key = name + '_' + (thunks[name] + 1);

                thunks[name]++;
            }
            else
            {
                key = name;

                thunks[name] = 1;
            }
        }
        else
        {
            key = !key ? ('|' + i) : key;
        }

        ret[key] = {
            index: i,
            child,
        };
    });

    return ret;
}

/**
 * Diff native attributes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffAttributes(left, right, actions)
{
    let pAttrs = left.attributes;
    let nAttrs = right.attributes;

    // No changes
    if (utils.is_empty(pAttrs) && utils.is_empty(nAttrs))
    {
        return;
    }

    utils.foreach(nAttrs, function(prop, value)
    {
        if (!utils.is_equal(value, pAttrs[prop]))
        {
            actions.push(action('setAttribute', [left, prop, value, pAttrs[prop]]));
        }
    });

    utils.foreach(pAttrs, function(prop, value)
    {
        if (!(prop in nAttrs))
        {
            actions.push(action('removeAttribute', [left, prop, pAttrs[prop]]));
        }
    });

    // Patch in new attributes
    nodeAttributes(left, nAttrs);
}
;// CONCATENATED MODULE: ./src/vdom/thunk.js








/**
 * Instantiate thunk component.
 * 
 * @param   {object}  vnode
 * @returns {import('../compat/Compoent').Component}
 */
function thunkInstantiate(vnode)
{
    let component = nodeComponent(vnode);

    if (!component)
    {
        let { fn, props } = vnode;

        props = utils.cloneDeep(props);

        component = utils.is_constructable(fn) ? new fn(props) : fn(props);
    }

    component.props.children = [jsxFactory(component)];

    return component;
}

/**
 * Renders thunk.
 * 
 * @param   {object}        component
 * @returns {object|array}
 */
function thunkRender(component)
{
    return jsxFactory(component);
}

/**
 * Re-renders thunk and commits patches.
 * 
 * @param  {object}  vnode
 */
function thunkUpdate(vnode)
{
    let component = vnode.__internals._component;
    let left      = vnode.children[0];
    let right     = jsxFactory(component);
    let actions   = tree(left, right);

    if (!utils.is_empty(actions.current))
    {
        commit(actions.current);
    }
}

function tree(left, right)
{
    let actions = {
        current: []
    };

    patch(left, right, actions.current);

    return actions;
}

function jsxFactory(component)
{
    RENDER_QUEUE.current = component;

    if (component.__internals._fn)
    {
        return component.render();
    }

    const jsx = component.render();

    if (jsx.trim() === '')
    {
        return createElement();
    }

    const context = renderContext(component);

    const result = parseJSX(jsx, { ...context, this: component });

    if (utils.is_array(result))
    {
        throw new Error('SyntaxError: Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
    }

    return result;
}

function renderContext(component)
{
    let ret = {};
    let props = utils.object_props(component);

    utils.foreach(props, function(i, prop)
    {
        if (prop !== 'render')
        {
            ret[prop] = component[prop];
        }
    });

    return ret;
}
;// CONCATENATED MODULE: ./src/vdom/index.js



;// CONCATENATED MODULE: ./src/dom/events.js


const _events = {};

/**
 * Add an event listener
 *
 * @access public
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
function addEventListener(element, eventName, handler, useCapture)
{
    // Boolean use capture defaults to false
    useCapture = typeof useCapture === 'undefined' ? false : Boolean(useCapture);

    // Class event storage
    var events = _events;

    // Make sure events are set
    if (!events)
    {
        _events = events = {};
    }

    // Make sure an array for the event type exists
    if (!events[eventName])
    {
        events[eventName] = [];
    }

    // Arrays
    if (Array.isArray(element))
    {
        for (var i = 0; i < element.length; i++)
        {
            addEventListener(element[i], eventName, handler, useCapture);
        }
    }
    else
    {
        // Push the details to the events object
        events[eventName].push(
        {
            element: element,
            handler: handler,
            useCapture: useCapture,
        });

        _addListener(element, eventName, handler, useCapture);
    }
}

/**
 * Removes event listeners on a DOM node
 *
 * If no event name is given, all attached event listeners are removed.
 * If no callback is given, all callbacks for the event type will be removed.
 * This function can still remove "annonymous" functions that are given a name as they are declared.
 * 
 * @access public
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
function removeEventListener(element, eventName, handler, useCapture)
{
    if (Array.isArray(element))
    {
        for (var j = 0; j < element.length; j++)
        {
            removeEventListener(element[j], eventName, handler, useCapture);
        }
    }
    else
    {
        // If the eventName name was not provided - remove all event handlers on element
        if (!eventName)
        {
            return _removeElementListeners(element);
        }

        // If the callback was not provided - remove all events of the type on the element
        if (!handler)
        {
            return _removeElementTypeListeners(element, eventName);
        }

        // Default use capture
        useCapture = typeof useCapture === 'undefined' ? false : Boolean(useCapture);

        var eventObj = _events[eventName];

        if (typeof eventObj === 'undefined')
        {
            return;
        }

        // Loop stored events and match node, event name, handler, use capture
        for (var i = 0, len = eventObj.length; i < len; i++)
        {
            if (eventObj[i]['handler'] === handler && eventObj[i]['useCapture'] === useCapture && eventObj[i]['element'] === element)
            {
                _removeListener(element, eventName, handler, useCapture);

                _events[eventName].splice(i, 1);

                break;
            }
        }
    }
}

/**
 * Removes all event listeners registered by the library
 *
 * @access public
 */
function clearEventListeners()
{
    var events = _events;

    for (var eventName in events)
    {
        var eventObj = events[eventName];

        var i = eventObj.length;

        while (i--)
        {
            _removeListener(eventObj[i]['element'], eventName, eventObj[i]['handler'], eventObj[i]['useCapture']);

            _events[eventName].splice(i, 1);
        }
    }
}

/**
 * Removes all event listeners registered by the library on nodes
 * that are no longer part of the DOM tree
 *
 * @access public
 */
function collectGarbage()
{
    var events = _events;
    for (var eventName in events)
    {
        var eventObj = events[eventName];

        var i = eventObj.length;

        while (i--)
        {
            var el = eventObj[i]['element'];

            // the window, body, and document always exist so keep these listeners
            if (el == window || el == document || el == document.body)
            {
                continue;
            }

            if (!_.in_dom(el))
            {
                _removeListener(eventObj[i]['element'], eventName, eventObj[i]['handler'], eventObj[i]['useCapture']);

                _events[eventName].splice(i, 1);
            }
        }
    }
}

/**
 * Removes all registered event listners on an element
 *
 * @access private
 * @param  node    element Target node element
 */
function _removeElementListeners(element)
{
    var events = _events;

    for (var eventName in events)
    {
        var eventObj = events[eventName];

        var i = eventObj.length;

        while (i--)
        {
            if (eventObj[i]['element'] === element)
            {
                _removeListener(eventObj[i]['element'], eventName, eventObj[i]['handler'], eventObj[i]['useCapture']);

                _events[eventName].splice(i, 1);
            }
        }
    }
}

/**
 * Removes all registered event listners of a specific type on an element
 *
 * @access private
 * @param  node    element Target node element
 * @param  string  type    Event listener type
 */
function _removeElementTypeListeners(element, type)
{
    var eventObj = _events[type];

    var i = eventObj.length;

    while (i--)
    {
        if (eventObj[i]['element'] === element)
        {
            _removeListener(eventObj[i]['element'], type, eventObj[i]['handler'], eventObj[i]['useCapture']);

            _events[type].splice(i, 1);
        }
    }
}

/**
 * Adds a listener to the element
 *
 * @access private
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
function _addListener(el, eventName, handler, useCapture)
{
    if (el.addEventListener)
    {
        el.addEventListener(eventName, handler, useCapture);
    }
    else
    {
        el.attachEvent('on' + eventName, handler, useCapture);
    }
}

/**
 * Removes a listener from the element
 *
 * @access private
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
function _removeListener(el, eventName, handler, useCapture)
{
    if (el.removeEventListener)
    {
        el.removeEventListener(eventName, handler, useCapture);
    }
    else
    {
        el.detachEvent('on' + eventName, handler, useCapture);
    }
}

/* harmony default export */ const events = ({ addEventListener, removeEventListener, clearEventListeners, collectGarbage });
;// CONCATENATED MODULE: ./src/dom/attributes.js



/**
 * List of browser prefixes
 *
 * @var array
 */
const CSS_PREFIXES = [
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
const CSS_PREFIXABLE = [
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

function setDomAttribute(DOMElement, name, value, previousValue)
{
    switch (name)
    {
        // Skip
        case 'key':
        case 'ref':
            break;

            // Style
        case 'style':

            if (utils.is_empty(value))
            {
                // remove all styles completely
                DOMElement.removeAttribute('style');
            }
            else if (utils.is_string(value))
            {
                // Clear style and overwrite
                DOMElement.style = '';

                // Apply current styles
                utils.foreach(value.split(';'), function(i, rule)
                {
                    var style = rule.split(':');

                    if (style.length >= 2)
                    {
                        css(DOMElement, style.shift().trim(), style.join(':').trim());
                    }
                });
            }
            else if (utils.is_object(value))
            {
                utils.foreach(value, function(prop, value)
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
                    removeEventListener(DOMElement, name.slice(2).toLowerCase(), previousValue);
                }
                if (value)
                {
                    addEventListener(DOMElement, name.slice(2).toLowerCase(), value);
                }
            }
            else
            {
                switch (name)
                {
                    case 'checked':
                    case 'disabled':
                    case 'selected':
                        DOMElement[name] = utils.bool(value);
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

function removeDomAttribute(DOMElement, name, previousValue)
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
                    removeEventListener(DOMElement, name.slice(2).toLowerCase(), previousValue);
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
    if (utils.is_object(property))
    {
        utils.foreach(property, function(prop, val)
        {
            css(el, prop, val);
        });
    }
    else
    {
        // vendor prefix the property if need be and convert to camelCase
        var properties = _vendorPrefix(property);

        // Loop vendored (if added) and unvendored properties and apply
        utils.foreach(properties, function(i, prop)
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
;// CONCATENATED MODULE: ./src/dom/create.js





/**
 * Create a real DOM element from a virtual element, recursively looping down.
 * When it finds custom elements it will render them, cache them, and keep going,
 * so they are treated like any other native element.
 */

function createDomElement(vnode, parentDOMElement)
{
    switch (vnode.type)
    {
        case 'text':
            return createTextNode(vnode, vnode.nodeValue);

        case 'empty':
            return createTextNode(vnode, '');

        case 'thunk':
            return flatten(createThunk(vnode, parentDOMElement));

        case 'fragment':
            return flatten(createFragment(vnode, parentDOMElement));

        case 'native':
            return flatten(createHTMLElement(vnode));
    }
}

function flatten(DOMElement)
{
    if (utils.is_array(DOMElement))
    {
        let ret = [];

        utils.foreach(DOMElement, function(i, child)
        {
            if (utils.is_array(child))
            {
                utils.array_merge(ret, flatten(child));
            }
            else
            {
                ret.push(child);
            }
        });

        return ret;
    }

    return DOMElement;
}

function createTextNode(vnode, text)
{
    let DOMElement = document.createTextNode(text);

    nodeElem(vnode, DOMElement);

    return DOMElement;
}

function createHTMLElement(vnode)
{
    let { tagName, attributes, children } = vnode;

    let DOMElement = createNativeElement(tagName);

    utils.foreach(attributes, function(prop, value)
    {
        setDomAttribute(DOMElement, prop, value);
    });

    nodeElem(vnode, DOMElement);

    utils.foreach(children, function(i, child)
    {
        if (!utils.is_empty(child))
        {
            let childDOMElem = createDomElement(child, DOMElement);

            // Returns a fragment
            if (utils.is_array(childDOMElem))
            {
                appendFragment(DOMElement, childDOMElem);
            }
            else
            {
                DOMElement.appendChild(childDOMElem);
            }
        }
    });

    return DOMElement;
}

/* Handles nested fragments */
function appendFragment(parentDOMElement, children)
{
    if (utils.is_array(children))
    {
        utils.foreach(children, function(i, child)
        {
            appendFragment(parentDOMElement, child);
        });
    }

    if (utils.is_htmlElement(children))
    {
        parentDOMElement.appendChild(children);
    }
}

function createThunk(vnode, parentDOMElement)
{
    // Skip this it's already been rendered if it's coming from a patch
    if (isThunkInstantiated(vnode))
    {
        console.log('already instantiated');

        let DOMElement = createDomElement(vnode.children[0]);

        return DOMElement;
    }

    let { fn, props } = vnode;

    let component = thunkInstantiate(vnode);

    // Create entire tree recursively
    let DOMElement = createDomElement(component.props.children[0]);

    // Point vnode
    pointVnodeThunk(vnode, component);

    return DOMElement;
}

function createFragment(vnode, parentDOMElement)
{
    let ret = [];

    utils.foreach(vnode.children, function(i, child)
    {
        ret.push(createDomElement(child));
    });

    return ret;
}
;// CONCATENATED MODULE: ./src/dom/commit.js






/**
 * Commit tree patching to DOM / vDom
 * 
 * @param {array}  actions  Array of actions.
 * 
 */
function commit(actions)
{
    utils.foreach(actions, function(i, action)
    {
        let { callback, args } = action;

        callback.apply(null, args);
    });
}

/**
 * Replace Vnode / DomNode text
 * 
 * @param {object}  vndone  Vnode to replace text
 * @param {string}  text    Text to set
 */
function replaceText(vnode, text)
{
    vnode.nodeValue = text;

    nodeElem(vnode).nodeValue = text;
}

/**
 * Replace Vnode / DomNode
 * 
 * @param {object}  vndone  Left Vnode to replace text
 * @param {object}  vndone  Right Vnode to replace with
 */
function commit_replaceNode(left, right)
{
    nodeWillUnmount(left);

    removeEvents(left);

    let rDOMElement = createDomElement(right);
    let lDOMElement = nodeElem(left);
    let parentDOMElement = parentElem(left);

    // We don't care if left or right is a thunk or fragment here
    // all we care about are the nodes returned from createDomElement()

    // left fragment nodes
    if (utils.is_array(lDOMElement))
    {
        // right multiple nodes also
        if (utils.is_array(rDOMElement))
        {
            utils.foreach(lDOMElement, function(i, lChild)
            {
                let rChild = rDOMElement[i];

                if (rChild)
                {
                    parentDOMElement.replaceChild(rChild, lChild);
                }
                else
                {
                    parentDOMElement.removeChild(lChild);
                }
            });
        }
        else
        {
            parentDOMElement.replaceChild(rDOMElement, lDOMElement.shift());

            if (!utils.is_empty(lDOMElement))
            {
                utils.foreach(lDOMElement, function(i, lChild)
                {
                    parentDOMElement.removeChild(lChild);
                });
            }
        }
    }
    // left single node
    else
    {
        // right multiple nodes
        if (utils.is_array(rDOMElement))
        {
            let targetSibling = lDOMElement.nextSibling;

            // Replace first node
            parentDOMElement.replaceChild(rDOMElement.shift(), lDOMElement);

            // Insert the rest at index
            if (!utils.is_empty(rDOMElement))
            {
                utils.foreach(rDOMElement, function(i, rChild)
                {
                    if (targetSibling)
                    {
                        parentDOMElement.insertBefore(rChild, targetSibling);
                    }
                    else
                    {
                        parentDOMElement.appendChild(rChild);
                    }
                });
            }
        }
        else
        {
            parentDOMElement.replaceChild(rDOMElement, lDOMElement);
        }
    }

    patchVnodes(left, right);
}

/**
 * Append Vnode / DomNode
 * 
 * @param {object}  parentVnode  Parent Vnode to append to
 * @param {object}  vndone       Vnode to append
 */
function appendChild(parentVnode, vnode)
{
    let parentDOMElement = nodeElemParent(parentVnode);
    let DOMElement = createDomElement(vnode);

    if (utils.is_array(DOMElement))
    {
        utils.foreach(DOMElement, function(i, child)
        {
            parentDOMElement.appendChild(child);
        });
    }
    else
    {
        parentDOMElement.appendChild(DOMElement);
    }

    parentVnode.children.push(vnode);
}

/**
 * Remove child Vnode / DomNode
 * 
 * @param {object}  parentVnode  Parent Vnode to append to
 * @param {object}  vndone       Vnode to append
 */
function removeChild(parentVnode, vnode)
{
    nodeWillUnmount(vnode);

    removeEvents(vnode);

    let parentDOMElement = parentElem(vnode);

    let DOMElement = nodeElem(vnode);

    if (utils.is_array(DOMElement))
    {
        utils.foreach(DOMElement, function(i, child)
        {
            parentDOMElement.removeChild(child);
        });
    }
    else
    {
        parentDOMElement.removeChild(DOMElement);
    }

    parentVnode.children.splice(parentVnode.children.indexOf(vnode), 1);
}

function removeEvents(vnode)
{
    if (isThunk(vnode) || isFragment(vnode))
    {
        if (!noChildren(vnode))
        {
            utils.foreach(vnode.children, function(i, child)
            {
                removeEvents(child);
            });
        }
    }
    else if (isNative(vnode))
    {
        let DOMElement = nodeElem(vnode);

        if (DOMElement)
        {
            removeEventListener(DOMElement);
        }

        if (!noChildren(vnode))
        {
            utils.foreach(vnode.children, function(i, child)
            {
                removeEvents(child);
            });
        }
    }
}

// Problem with moving / inserting to index
// is actual DOM index doesn't line up with the vnode index
// if a vnode is nesting a fragment

function insertAtIndex(parentVnode, vnode, index)
{
    let vIndex = index;
    let dIndex = childDomIndex(parentVnode, index);
    let DOMElement = createDomElement(vnode);
    let parentDOMElement = nodeElemParent(parentVnode);

    if (utils.is_array(DOMElement))
    {
        utils.foreach(DOMElement, function(i, child)
        {
            if (dIndex >= parentDOMElement.children.length)
            {
                parentDOMElement.appendChild(child);
            }
            else
            {
                parentDOMElement.insertBefore(child, parentDOMElement.children[dIndex]);
            }

            dIndex++;
        });
    }
    else
    {
        if (dIndex >= parentDOMElement.children.length)
        {
            parentDOMElement.appendChild(DOMElement);
        }
        else
        {
            parentDOMElement.insertBefore(DOMElement, parentDOMElement.children[dIndex]);
        }
    }

    parentVnode.children.splice(vIndex, 0, vnode);
}

function moveToIndex(parentVnode, vnode, index)
{
    let vIndex = index;
    let dIndex = childDomIndex(parentVnode, index);
    let DOMElement = nodeElem(vnode);
    let isFragment = utils.is_array(DOMElement);
    let parentDOMElement = nodeElemParent(parentVnode);
    let currIndex = isFragment ? Array.prototype.slice.call(parentDOMElement.children).indexOf(DOMElement[0]) : Array.prototype.slice.call(parentDOMElement.children).indexOf(DOMElement);

    if (isFragment)
    {
        moveFragmentDomEls(parentDOMElement, DOMElement, dIndex, currIndex);

        return;
    }

    // Nothing to do
    if (currIndex === dIndex || (dIndex === 0 && parentDOMElement.children.length === 0))
    {

    }
    // Move to start
    else if (dIndex === 0)
    {
        parentDOMElement.insertBefore(DOMElement, parentDOMElement.firstChild);
    }
    // Move to end
    else if (dIndex >= parentDOMElement.children.length)
    {
        parentDOMElement.removeChild(DOMElement);
        parentDOMElement.appendChild(DOMElement);
    }
    else
    {
        parentDOMElement.insertBefore(DOMElement, parentDOMElement.children[dIndex]);
    }

    // Move vnode
    let vChildren = parentVnode.children;
    let vCurrIndex = vChildren.indexOf(vnode);

    // Do nothing
    if (vCurrIndex === vIndex || (vIndex === 0 && vChildren.length === 0))
    {
        // Nothing to do
    }
    else
    {
        vChildren.splice(vIndex, 0, vChildren.splice(vCurrIndex, 1)[0]);
    }
}

function moveFragmentDomEls(parentDOMElement, DOMElements, index, currIndex)
{
    // Nothing to do
    if (currIndex === index || (index === 0 && parentDOMElement.children.length === 0))
    {
        return;
    }

    // Move to start
    if (index === 0)
    {
        utils.foreach(DOMElements, function(i, child)
        {
            parentDOMElement.insertBefore(child, parentDOMElement.firstChild);
        });
    }
    // Move to end
    else if (index >= parentDOMElement.children.length)
    {
        utils.foreach(DOMElements, function(i, child)
        {
            parentDOMElement.removeChild(child);
            parentDOMElement.appendChild(child);
        });
    }
    else
    {
        utils.foreach(DOMElements, function(i, child)
        {
            parentDOMElement.insertBefore(child, parentDOMElement.children[index]);

            index++;
        });
    }
}

function setAttribute(vnode, name, value, previousValue)
{
    setDomAttribute(nodeElem(vnode), name, value, previousValue);
}

function removeAttribute(vnode, name, previousValue)
{
    removeDomAttribute(nodeElem(vnode), name, previousValue)
}

/**
 * Returns the actual parent DOMElement of a parent node.
 *  
 * @param   {object}  parent
 * @returns {HTMLElement}
 */
function nodeElemParent(parent)
{
    if (isFragment(parent) || isThunk(parent))
    {
        let child = nodeElem(parent);

        return utils.is_array(child) ? child[0].parentNode : child.parentNode;
    }

    return nodeElem(parent);
}


/**
 * Returns the DOM index 
 *  
 * @param   {object}  vnode
 * @returns {HTMLElement}
 */
function childDomIndex(parent, index)
{
    if (parent.children.length <= 1)
    {
        return 0;
    }

    let buffer = 0;

    utils.foreach(parent.children, function(i, child)
    {
        if (i >= index)
        {
            return false;
        }

        if (isThunk(child))
        {
            let els = nodeElem(child);

            if (utils.is_array(els))
            {
                buffer += els.length;
            }
        }
    });

    return buffer + index;
}

const ACTION_MAP = {
    replaceNode: commit_replaceNode,
    appendChild,
    removeChild,
    insertAtIndex,
    moveToIndex,
    replaceText,
    setAttribute,
    removeAttribute
};

function action(name, args)
{
    let callback = ACTION_MAP[name];

    return {
        callback,
        args
    };
}
;// CONCATENATED MODULE: ./src/dom/index.js



;// CONCATENATED MODULE: ./src/render/root.js






/**
 * Root class.
 *  
 * @property {HTMLElement}         htmlRootEl  Root html element
 * @property {function}            component   Root component
 * @property {object | undefined}  options     Root options
 */
class Root
{
    /**
     * Constructor.
     *  
     * @param {HTMLElement}         htmlRootEl  Root html element
     * @param {object | undefined}  options     Options (optional)
     */
    constructor(htmlRootEl, options)
    {
        this.htmlRootEl = htmlRootEl;

        this.options = options;

        this.component = null;
    }

    /**
     * Render root component.
     *  
     * @param function | string}   component   Component to render
     * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
     */
    render(componentOrJSX, rootProps)
    {
        this.component = !utils.is_callable(componentOrJSX) ? this.__componentFactory(componentOrJSX, rootProps) : componentOrJSX;

        this.htmlRootEl._reactiflyRootVnode ? this.__patchRoot() : this.__renderRoot(rootProps)
    }

    /**
     * Creates wrapper function when passed as JSX string.
     *  
     * @param {string}              jsxStr      Root JSX to render
     * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
     */
    __componentFactory(jsxStr, rootProps)
    {
        const renderFunc = function()
        {
            return jsx('<Fragment>' + jsxStr + '</Fragment>', rootProps);
        };

        return renderFunc;
    }

    /**
     * Patches the root Vnode/component when re-rending root or state change.
     *
     */
    __patchRoot()
    {
        let actions = { current: [] };

        patch(this.htmlRootEl._reactiflyRootVnode, createElement(this.component), actions.current);

        if (!utils.is_empty(actions.current))
        {
            commit(actions.current);
        }
    }

    /**
     * Render the root component.
     *
     */
    __renderRoot(rootProps)
    {
        let vnode = createElement(this.component, rootProps);

        let DOMElement = createDomElement(vnode, this.htmlRootEl);

        this.__mount(DOMElement);

        this.htmlRootEl._reactiflyRootVnode = vnode;
    }

    /**
     * Mount root element
     * 
     * @param {HTMLElement | array } DOMElement  HTMLElement(s) returned from root component
     *
     */
    __mount(DOMElement)
    {
        let _this = this;

        let parent = this.htmlRootEl;

        // Where root renders a fragment or returns a thunk that renders a fragment
        if (utils.is_array(DOMElement))
        {
            utils.foreach(DOMElement, function(i, childDomElement)
            {
                if (utils.is_array(childDomElement))
                {
                    _this.__mount(childDomElement, parent);
                }
                else
                {
                    parent.appendChild(childDomElement);
                }
            });

            return;
        }

        if (utils.is_htmlElement(DOMElement))
        {
            parent.appendChild(DOMElement);
        }
    }
}
;// CONCATENATED MODULE: ./src/render/index.js


/**
 * Create root tree
 *  
 * @param   {HTMLElement}         htmlRootEl  Root html element
 * @param   {object | undefined}  options     Options (optional)
 * @returns {import('./root').Root}
 */
function createRoot(htmlRootEl, options)
{
    return new Root(htmlRootEl, options);
}

/**
 * Render a component to an HTMLElement
 *  
 * @param {function | string}   component   Component to render
 * @param {HTMLElement}         htmlRootEl  Root html element
 * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
 */
function render(component, htmlRootEl, rootProps)
{
    let root = createRoot(htmlRootEl);

    root.render(component, rootProps);
}
;// CONCATENATED MODULE: ./src/index.js







const Reactifly = 
{
	createRoot: createRoot,
	render: render,
	register: register,
	Component: Component, Fragment: Fragment, useState: useState,
	jsx: jsx,
	createElement: createElement,
	h: createElement
};

let win = window || __webpack_require__.g;

win.Reactifly = Reactifly;

/* harmony default export */ const src = ((/* unused pure expression or super */ null && (Reactifly)));

/******/ })()
;