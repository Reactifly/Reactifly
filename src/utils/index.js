const _wMap = function()
{
    return this;
}

_wMap.prototype = {};

_wMap.prototype.set = function(key, value)
{
    array_set(key, value, this);
};

_wMap.prototype.get = function(key)
{
    return array_get(key, this);
};

_wMap.prototype.delete = function(key)
{
    array_delete(key, this);
};

_wMap.prototype.isset = function(key)
{
    return array_has(key, this);
};

/**
 * Returns an immutable object with set,get,isset, delete methods that accept dot.notation
 *
 * @return {_wMap}
 */
export function wMap()
{
    return new _wMap;
}

/**
 * Returns var if set
 *
 * @param  node   el   Target element
 * @param  string type Valid event name
 */
export function isset(mixed_var, keys)
{
    if (!mixed_var)
    {
        return;
    }
    
    keys = keys.split('.');

    let len = keys.length;

    for (var i = 0; i < len; i++)
    {
        mixed_var = mixed_var[keys[i]];

        if (!mixed_var)
        {
            return;
        }
    }

    return mixed_var;
}

/**
 * Triggers a native event on an element
 *
 * @param  node   el   Target element
 * @param  string type Valid event name
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
 * Set a key using dot/bracket notation on an object or array
 *
 * @param  string       path   Path to set
 * @param  mixed        value  Value to set
 * @param  object|array object Object to set into
 * @return object|array
 */
export function array_set(path, value, object)
{
    _arraySetRecursive(_arrayKeySegment(path), value, object);

    return object;
}

/**
 * Gets an from an array/object using dot/bracket notation
 *
 * @param  string       path   Path to get
 * @param  object|array object Object to get from
 * @return mixed
 */
export function array_get(path, object)
{
    return _arrayGetRecursive(_arrayKeySegment(path), object);
}

/**
 * Checks if array/object contains path using dot/bracket notation
 *
 * @param  string       path   Path to check
 * @param  object|array object Object to check on
 * @return bool
 */
export function array_has(path, object)
{
    return typeof array_get(path, object) !== 'undefined';
}

/**
 * Deletes from an array/object using dot/bracket notation
 *
 * @param  string       path   Path to delete
 * @param  object|array object Object to delete from
 * @return object|array
 */
export function array_delete(path, object)
{
    _arrayDeleteRecursive(_arrayKeySegment(path), object);

    return object;
}

/**
 * Filters empty array entries and returns new array
 *
 * @param  object|array object Object to delete from
 * @return object|array
 */
export function array_filter(arr)
{
    let isArr = is_array(arr);
    let ret   = isArr ? [] : {};

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
 * Merges multiple objects or arrays into the original
 *
 * @param  object|array object Object to delete from
 * @return object|array
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
 * Recursively delete from array/object
 *
 * @access private
 * @param  array        keys   Keys in search order
 * @param  object|array object Object to get from
 * @return mixed
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
 * Recursively search array/object
 *
 * @access private
 * @param  array        keys   Keys in search order
 * @param  object|array object Object to get from
 * @return mixed
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
 * Recursively set array/object
 *
 * @access private
 * @param  array        keys   Keys in search order
 * @param  mixed        value  Value to set
 * @param  parent       object|array or null
 * @param  object|array object Object to set on
 */
function _arraySetRecursive(keys, value, object, nextKey)
{
    var key     = keys.shift();
    var islast  = keys.length === 0;
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
 * Segments an array/object path using dot notation
 *
 * @access private
 * @param  string  path Path to parse
 * @return array
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
 * @param  {Object} obj Object
 * @return {Object} 
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
 * @param  mixed  mixed_var Variable to evaluate
 * @return bool
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

    while(element)
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
 * Checks if variable is node.
 *
 * @param  mixed  mixed_var Variable to evaluate
 * @return bool
 */
export function is_htmlElement(mixed_var)
{
    return !!(mixed_var && mixed_var.nodeType === 1);
}

/**
 * Is callable ?
 *
 * @param  mixed  mixed_var Variable to check
 * @return bool
 */
export function is_callable(mixed_var)
{
    return Object.prototype.toString.call(mixed_var) === '[object Function]';
}

/**
 * Checks if variable is a class declaration.
 *
 * @param  mixed  mixed_var Variable to evaluate
 * @return bool
 */
export function is_constructable(mixed_var)
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

    // ES6 class
    if (is_class(mixed_var, true))
    {
        return true;
    }

    // If prototype is empty 
    let props = object_props(mixed_var.prototype);

    return props.length >= 1;
}

/**
 * Checks if variable is a class declaration.
 *
 * @param  mixed  mixed_var Variable to evaluate
 * @return bool
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

    if (classname)
    {
        if (typeof mixed_var === 'function')
        {
            let re = new RegExp('^\\s*class\\s+(' + classname + '(\\s+|\\{)|\\w+\\s+extends\\s+' + classname + ')', 'i');

            let regRet = re.test(mixed_var.toString());

            if (strict)
            {
                return regRet;
            }
            
            return is_constructable(mixed_var) && mixed_var.name === classname;
        }

        return false;
    }

    if (strict)
    {
        return typeof mixed_var === 'function' && /^\s*class\s+/.test(mixed_var.toString());
    }

    return is_constructable(mixed_var);
}

/**
 * Checks if variable is a class declaration.
 *
 * @param  mixed  mixed_var Variable to evaluate
 * @return bool
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
 * Gets variable size 
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
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
        return mixed_var === true ? 1 : 0;
    }
    else (is_object(mixed_var))
    {
        return Object.keys(mixed_var).length;
    }

    return 1;
}

/**
 * Check if two vars are equal
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
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

    if (typeof mixed_var === 'string')
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
 * Checks if variable is an object
 *
 * @param  mixed  mixed_var Variable to evaluate
 * @return bool
 */
export function is_object(mixed_var)
{
    return mixed_var !== null && (Object.prototype.toString.call(mixed_var) === '[object Object]');
}

/**
 * Is array
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function is_array(mixed_var, strict)
{
    strict = typeof strict === 'undefined' ? false : strict;

    let type = Object.prototype.toString.call(mixed_var);

    return !strict ? type === '[object Array]' || type === '[object Arguments]' || type === '[object NodeList]' : type === '[object Array]';
}

/**
 * Is string
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function is_string(mixed_var)
{
    return typeof mixed_var === 'string' || mixed_var instanceof String;
}

/**
 * Is number
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function is_number(mixed_var)
{
    return typeof mixed_var === 'number' && !isNaN(mixed_var);
}

/**
 * Is string
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
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
 * Is undefined
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function is_undefined(mixed_var)
{
    return typeof mixed_var === 'undefined';
}

/**
 * Is null
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function is_null(mixed_var)
{
    return mixed_var === null;
}

/**
 * Is bool
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function is_bool(mixed_var)
{
    return mixed_var === false || mixed_var === true;
}

/**
 * Returns object properties as array of keys
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
 */
export function object_props(mixed_var)
{
    if (!is_object(mixed_var))
    {
        return [];
    }

    // If prototype is empty 
    let excludes = ['constructor', '__proto__', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__', '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf'];
    let funcs    = Object.getOwnPropertyNames(Object.getPrototypeOf(mixed_var));
    let props    = Object.keys(mixed_var);
    let keys     = [...funcs, ...props];

    return keys.filter(function(key)
    {
        return !excludes.includes(key);
    });
}

/**
 * Is empty
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
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
 * Check if two vars are equal
 * 
 * @param  mixed mixed_var Variable to test
 * @return bool
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

function cloneObj(obj)
{
    // Handle date objects
    if (obj instanceof Date)
    {
        let r = new Date();

        r.setTime(obj.getTime());
        
        return r;
    }

    // Handle empty 
    if (is_empty(obj))
    {
        return {};
    }

    // Loop
    let keys = object_props(obj);
    let ret  = {};

    foreach(keys, function(i, key)
    {
        ret[key] = cloneDeep(obj[key], ret);     
    });
    
    return ret;
}

function constructorClone(obj)
{
    let name = callable_name(obj);

    if (name === 'Object')
    {
        return {};
    }

    let ret = {};

    ret.constructor = obj.constructor;

    return ret;
}

function cloneFunc(func, context)
{
    context = typeof context === 'undefined' ? func : window;

    return func.bind(context);
}

function cloneArray(arr)
{
    let ret = [];
   
    foreach(arr, function(i, val)
    {
        ret[i] = cloneDeep(val);
    });

    return ret;
}

export function cloneDeep(mixed_var, context)
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
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources)
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
                    [key]:
                    {}
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

export function foreach(obj, callback, args)
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
 * Map with break
 * 
 * return undefined to break loop, true to keep, false to reject
 * 
 * @param [{Array}|{Objet}]     arrayOrObj Object or array
 * @param {Function}            callback   Callback
 * @param {{Array}|{undefined}} context    Args to apply to callback
 * 
 * // callback(value, keyOrIndex) this = context 
 */
export function map(obj, callback, args)
{
    let arrType = is_array(obj) ? 'array' : 'obj';
    let ret     = arrType === 'array' ? [] : {};
    let keys    = arrType === 'array' ? Array.from(obj.keys()) : Object.keys(obj);
    let len     = keys.length;

    var thisArg = !is_undefined(args) && !is_array(args) ? args : obj;
    
    // This arg gets set to array/object, unless a single arg is provided...

    if (is_array(args))
    {
        for (let i = 0; i < len; i++)
        {
            let key = keys[i];

            let value = callback.apply(thisArg, array_merge([ key, obj[key] ], args));

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
    wMap,
    isset,
    triggerEvent,
    foreach,
    array_set,
    array_get,
    array_has,
    array_delete,
    array_merge,
    dotify,
    size,
    bool,
    cloneDeep,
    in_dom,
    is_equal,
    is_htmlElement,
    is_callable,
    is_constructable,
    is_class,
    object_props,
    callable_name,
    is_null,
    is_undefined,
    is_empty,
    is_object,
    is_array,
    is_number,
    is_string,
    mergeDeep,
    map,
};

export default _;