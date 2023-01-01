/**
 * Cached variable types.
 *
 * @var {string}
 */

// Standard
const NULL_TAG   = '[object Null]';
const UNDEF_TAG  = '[object Undefined]';
const BOOL_TAG   = '[object Boolean]';
const STRING_TAG  = '[object String]';
const NUMBER_TAG = '[object Number]';
const FUNC_TAG   = '[object Function]';
const ARRAY_TAG  = '[object Array]';
const ARGS_TAG   = '[object Arguments]';
const NODELST_TAG = '[object NodeList]';
const OBJECT_TAG = '[object Object]';
const DATE_TAG   = '[object Date]';

// Unusual
const SET_TAG     = '[object Set]';
const MAP_TAG    = '[object Map]';
const REGEXP_TAG = '[object RegExp]';
const SYMBOL_TAG  = '[object Symbol]';

// Array buffer
const ARRAY_BUFFER_TAG = '[object ArrayBuffer]';
const DATAVIEW_TAG = '[object DataView]';
const FLOAT32_TAG = '[object Float32Array]';
const FLOAT64_TAG = '[object Float64Array]';
const INT8_TAG = '[object Int8Array]';
const INT16_TAG = '[object Int16Array]';
const INT32_TAG = '[object Int32Array]';
const UINT8_TAG = '[object Uint8Array]';
const UINT8CLAMPED_TAG = '[object Uint8ClampedArray]';
const UINT16_TAG = '[object Uint16Array]';
const UINT32_TAG = '[object Uint32Array]';

// Non-cloneable
const ERROR_TAG  = '[object Error]';
const WEAKMAP_TAG = '[object WeakMap]';

// Arrayish _tags
const ARRAYISH_TAGS = [ARRAY_TAG, ARGS_TAG, NODELST_TAG];

// Object.prototype.toString
const TO_STR = Object.prototype.toString;

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function getType(value)
{
    if (value == null)
    {
        return value === undefined ? '[object Undefined]' : '[object Null]'
    }
    
    return TO_STR.call(value);
}

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
    return array_get(key, this);
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
export function obj()
{
    return new _map;
}

/**
 * Triggers a native event on an element.
 *
 * @param  {HTMLElement}  el    Target element
 * @param  {string}       type  Valid event name
 */
export function triggerEvent(el, type)
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
export function array_set(path, value, object)
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
export function array_get(path, object)
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
export function array_has(path, object)
{
    return typeof array_get(path, object) !== 'undefined';
}

/**
 * Deletes from an array/object using dot/bracket notation.
 *
 * @param   {string}        path   Path to delete
 * @param   {object|array}  object Object to delete from
 * @returns {object|array}
 */
export function array_delete(path, object)
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
export function array_filter(arr)
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
export function array_merge()
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
 * Removes duplicates and returns new array.
 *
 * @param   {array} arr Array to run
 * @returns {array}
 */
export function array_unique(arr)
{
    let onlyUnique = function(value, index, self)
    {
        return self.indexOf(value) === index;
    }

    return arr.filter(onlyUnique);
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
export function dotify(obj)
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
export function in_dom(element)
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
 * Returns function / class name
 *
 * @param   {mixed}  mixed_var Variable to evaluate
 * @returns {string}
 */
export function callable_name(mixed_var)
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
export function size(mixed_var)
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
export function bool(mixed_var)
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
export function is_object(mixed_var)
{
    return mixed_var !== null && getType(mixed_var) === OBJECT_TAG;
}

/**
 * Is array.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_array(mixed_var, strict)
{
    strict = typeof strict === 'undefined' ? false : strict;

    let type = getType(mixed_var);

    return !strict ? ARRAYISH_TAGS.includes(type) : type === ARRAY_TAG;
}

/**
 * Is string.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_string(mixed_var)
{
    return getType(mixed_var) === STRING_TAG;
}

/**
 * Is number.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_number(mixed_var)
{
    return !isNaN(mixed_var) && getType(mixed_var) === NUMBER_TAG;
}

/**
 * Is string.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_numeric(mixed_var)
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
export function is_undefined(mixed_var)
{
    return getType(mixed_var) === UNDEF_TAG
}

/**
 * Is null.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_null(mixed_var)
{
    return getType(mixed_var) === NULL_TAG;
}

/**
 * Is bool.
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_bool(mixed_var)
{
    return getType(mixed_var) === BOOL_TAG;
}

export function is_date(mixed_var)
{
    return getType(mixed_var) === DATE_TAG;
}

export function is_regexp(mixed_var)
{
    return getType(mixed_var) === REGEXP_TAG;
}

export function is_symbol(mixed_var)
{
    return getType(mixed_var) === SYMBOL_TAG;
}

export function is_nodelist(mixed_var)
{
    return getType(mixed_var) === NODELST_TAG;
}

export function is_function(mixed_var)
{
    return getType(mixed_var) === FUNC_TAG;
}

export function is_args(mixed_var)
{
    return getType(mixed_var) === ARGS_TAG;
}

export function is_set(mixed_var)
{
    return getType(mixed_var) === SET_TAG;
}

export function is_map(mixed_var)
{
    return getType(mixed_var) === MAP_TAG;
}

export function is_buffer(mixed_var)
{
    return getType(mixed_var) === ARRAY_BUFFER_TAG;
}

export function is_dataview(mixed_var)
{
    return getType(mixed_var) === DATAVIEW_TAG;
}

/**
 * Checks if variable is HTMLElement.
 *
 * @param   {mixed}  mixed_var  Variable to evaluate
 * @returns {boolean}
 */
export function is_htmlElement(mixed_var)
{
    return mixed_var && mixed_var.nodeType;
}

/**
 * Is variable a function / constructor.
 *
 * @param   {mixed}  mixed_var  Variable to check
 * @returns {boolean}
 */
export function is_callable(mixed_var)
{
    return is_function(mixed_var);
}

/**
 * Checks if variable is construable.
 *
 * @param   {mixed}  mixed_var  Variable to evaluate
 * @returns {boolean}
 */
export function is_constructable(mixed_var)
{
    // Not a function
    if (typeof mixed_var !== 'function' || mixed_var === null)
    {
        return false;
    }

    // Strict ES6 class
    if (/^\s*class\s+\w+/.test(mixed_var.toString()))
    {
        return true;
    }

    // Native arrow functions

    if (!mixed_var.prototype || !mixed_var.prototype.constructor)
    {
        return false;
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
export function is_class(mixed_var, classname, strict)
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

    if (typeof mixed_var !== 'function' || !is_constructable(mixed_var))
    {
        return false;
    }

    let isES6 = /^\s*class\s+\w+/.test(mixed_var.toString());

    if (classname)
    {
        if (!isES6 && strict)
        {
            return false;
        }

        if (mixed_var.name === classname || mixed_var.prototype.constructor.name === classname)
        {
            return true;
        }

        let protos = [];
        let proto = mixed_var.prototype || Object.getPrototypeOf(mixed_var);
        let ret = false;

        while(proto && proto.constructor)
        {
            // recursive stopper
            if (protos.includes.proto)
            {
                break;
            }

            protos.push(proto);

            if (proto.constructor.name === classname)
            {
                ret = true;

                break;
            }

            proto = proto.prototype || Object.getPrototypeOf(proto);
        }
    
        return ret;
    }

    // ES6 class declaration depending on strict
    
    return strict ? isES6 : is_constructable(mixed_var);
}

/**
 * Returns object properties and methods as array of keys.
 * 
 * @param   {mixed}    mixed_var    Variable to test
 * @param   {boolean}  withMethods  Return methods and props (optional) (default "true")
 * @returns {array}
 */
export function object_props(mixed_var, withMethods)
{
    withMethods = typeof withMethods === 'undefined' ? true : false;

    let keys     = Object.keys(mixed_var);   
    let excludes = ['constructor', '__proto__', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__', '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf', 'length', 'name', 'arguments', 'caller', 'prototype', 'apply', 'bind', 'call'];

    if (withMethods)
    {
        let protos = [];
        let funcs  = Object.getOwnPropertyNames(mixed_var);
        let proto  = mixed_var.prototype || Object.getPrototypeOf(mixed_var);

        while(proto)
        {
            // recursive stopper
            if (protos.includes.proto)
            {
                break;
            }

            protos.push(proto);

            let protoFuncs = Object.getOwnPropertyNames(proto);

            funcs = [...funcs, ...protoFuncs];

            proto = proto.prototype || Object.getPrototypeOf(proto);
        }

        keys = [...keys, ...funcs];
    }

    return array_unique(keys.filter(function(key)
    {
        return !excludes.includes(key);
    }));
}

/**
 * Is empty
 * 
 * @param   {mixed}  mixed_var  Variable to test
 * @returns {boolean}
 */
export function is_empty(mixed_var)
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
        return isNaN(mixed_var);
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
        if (!is_equal(val, b[i]))
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
export function is_equal(a, b)
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
function cloneObj(obj, context)
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
    let ret  = {};

    if (keys.length === 0)
    {
        return ret;
    }

    foreach(keys, function(i, key)
    {
        ret[key] = cloneDeep(obj[key], typeof context === 'undefined' ? ret : context);
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
    context = typeof context === 'undefined' ? window : context;

    return func.bind(context);
}

/**
 * Clones an array
 * 
 * @param   {array}  arr
 * @returns {array}
 */
function cloneArray(arr, context)
{
    let ret = [];

    foreach(arr, function(i, val)
    {
        ret[i] = cloneDeep(val, context);
    });

    return ret;
}

function cloneDate(d)
{
    let r = new Date();

    r.setTime(d.getTime());

    return r;
}

function cloneSymbol(symbol)
{
    return Object(Symbol.prototype.valueOf.call(symbol));
}

function cloneRegExp(regexp)
{
    let reFlags = /\w*$/;

    let result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    
    result.lastIndex = regexp.lastIndex;
    
    return result;
}

function cloneMap(m, context)
{
    const ret = new Map();

    m.forEach((v, k) =>
    {
        ret.set(k, cloneDeep(v, context));
    });

    return ret;
}

function cloneSet(s, context)
{
    const ret = new Set();

    s.forEach((val, k) =>
    {
        ret.add(k, cloneDeep(v, context));
    });

    return ret;
}

function cloneArrayBuffer(arrayBuffer)
{
    const result = new arrayBuffer.constructor(arrayBuffer.byteLength)
    
    new Uint8Array(result).set(new Uint8Array(arrayBuffer));
    
    return result;
}

function cloneDataView(dataView)
{
    const buffer = cloneArrayBuffer(dataView.buffer);
    
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Creates a clone of `buffer`.
 *
 * @param   {Buffer}   buffer   The buffer to clone.
 * @param   {boolean} [isDeep]  Specify a deep clone.
 * @returns {Buffer}   Returns  the cloned buffer.
 */
function cloneBuffer(buffer)
{
    const length = buffer.length;

    const result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    
    return result;
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray)
{
    const buffer = cloneArrayBuffer(typedArray.buffer);

    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}


function cloneVar(mixed_var, context)
{
    let tag = getType(mixed_var);

    switch (tag)
    {
        case OBJECT_TAG:
            return cloneObj(mixed_var, context);

        case ARRAY_TAG:
        case NODELST_TAG:
        case ARGS_TAG:
            return cloneArray(mixed_var, context);

        case FUNC_TAG:
            return cloneFunc(mixed_var, context);

        case NULL_TAG:
            return null;

        case UNDEF_TAG:
            return;

        case BOOL_TAG:
            return mixed_var === true ? true : false;

        case STRING_TAG:
            return mixed_var.slice();

        case NUMBER_TAG:
            let n = mixed_var;
            return n;
    
        case REGEXP_TAG:
            return cloneRegExp(mixed_var, context);

        case SYMBOL_TAG:
            return cloneSymbol(mixed_var);

        case DATE_TAG:
            return cloneDate(mixed_var);

        case SET_TAG:
            return cloneSet(mixed_var, context);

        case MAP_TAG:
            return cloneMap(mixed_var, context);

        case ARRAY_BUFFER_TAG:
            return cloneArrayBuffer(mixed_var);

        case DATAVIEW_TAG:
            return cloneDataView(mixed_var);

        case ARRAY_BUFFER_TAG:
            return cloneBuffer(mixed_var);

        case FLOAT32_TAG: case FLOAT64_TAG:
        case INT8_TAG: case INT16_TAG: case INT32_TAG:
        case UINT8_TAG: case UINT8CLAMPED_TAG: case UINT16_TAG: case UINT32_TAG:
            return cloneTypedArray(object);

        case ERROR_TAG:
        case WEAKMAP_TAG:
            return {};
    }

    return mixed_var;
}

/**
 * Clones any variables
 * 
 * @param   {mixed}  mixed_var
 * @param   {mixed}  context   Context to bind functions
 * @returns {mixed}
 */
export function cloneDeep(mixed_var, context)
{
    return cloneVar(mixed_var, context);
}

/**
 * Deep merge two objects.
 * 
 * @param   {object} target
 * @param   {object} ...sources
 * @returns {object}
 */
export function mergeDeep()
{
    let args = Array.prototype.slice.call(arguments);

    // No args
    if (args.length === 0)
    {
        throw new Error('Nothing to merge.');
    }
    // Single arg
    else if (args.length === 1)
    {
        return args[1];
    }

    // Must be an object
    if (!is_object(args[0]))
    {
        throw new Error('Arguments must be an object.');
    }

    // Remove first and cache
    let first = args.shift();
   
    foreach(args, function(i, arg)
    {
        if (!is_object(arg))
        {
            throw new Error('Arguments must be an object.');
        }

        let cloned = cloneDeep(arg, first);

        foreach(cloned, function(k, v)
        {
            first[k] = v;
        });
    });

    return first;
}

/**
 * Foreach.
 *  
 * @param   {array|object}  obj
 * @param   {function}      callback
 * @param   {array|mixed}   args      If single arg provided gets apllied as this to callback, otherwise args apllied to callback
 * @returns {array|object}
 */
export function foreach(obj, callback, args)
{
    if (typeof obj !== 'object' || obj === null) return;

    let isArray = Object.prototype.toString.call(obj) === '[object Array]',
    i    = 0,
    keys = isArray ? null : Object.keys(obj),
    len  = isArray ? obj.length : keys.length,
    key,
    value;
        
    var thisArg = typeof args !== 'undefined' && Object.prototype.toString.call(args) !== '[object Array]' ? args : obj;

    if (Object.prototype.toString.call(args) === '[object Array]')
    {
        if (isArray)
        {
            for (; i < len; i++)
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
            for (; i < len; i++)
            {
                key = keys[i];

                value = callback.apply(thisArg, array_merge([key, obj[key]], args));

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
            for (; i < len; i++)
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
            for (; i < len; i++)
            {
                key = keys[i];

                value = callback.call(thisArg, key, obj[key]);

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
export function map(obj, callback, args)
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



const _ = {
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
    is_equal,
    in_dom,
    size,
    bool,
    object_props,
    callable_name,
    triggerEvent,
    obj,
    array_set,
    array_get,
    array_has,
    array_delete,
    array_filter,
    array_merge,
    array_unique,
    dotify,
    cloneDeep,
    mergeDeep,
    foreach,
    map,
};

export default _;