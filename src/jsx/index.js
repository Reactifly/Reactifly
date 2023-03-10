import parse, { BINDINGS_CACHE } from './parser';
import { is_object, is_undefined, is_function } from '../utils/index';

/**
 * Mian API to convert JSX from string into 'createElement'.
 *
 * @param  {string}  jsx       JSX in string format.
 * @param  {object}  bindings  Key/value pairs of bindings
 */
export function jsx(jsx, bindings)
{
    if (!is_undefined(bindings) && !is_object(bindings))
    {
        throw new Error('Variables should be supplied to [jsx] as an object e.g [jsx("<div class={name} />", {name: "foo"})]');
    }

    return parse(jsx, bindings);
}

/**
 * Register a dependencies.
 *
 * @param  {mixed}   binding  Can be any variable.
 * @param  {string}  key      Name to set dependency as
 */
export function bind(key, val)
{
    if (is_object(key))
    {
        for (let k in key)
        {
            __bind(k, key[k]);
        }
    }
    else
    {
        __bind(key, val);
    }
}

function __bind(key, val)
{    
    if (is_function(val) && key !== val.name)
    {
        Object.defineProperty(val, 'name', { value: key, writable: false });
    }

    BINDINGS_CACHE[key] = val; 
}

