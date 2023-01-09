import parse, { COMPONENT_CACHE } from './parser';
import { is_object, is_undefined, callable_name } from '../utils/index';

/**
 * Mian API to convert JSX from string into 'createElement'
 *
 * @param  {string}  jsx   JSX in string format.
 * @param  {object}  vars  Key/value pairs of dependencies
 */
export function jsx(jsx, vars)
{
    if (!is_undefined(vars) && !is_object(vars))
    {
        throw new Error('Variables should be supplied to [jsx] as an object e.g [jsx("<div class={name} />", {name: "foo"})]');
    }

    return parse(jsx, vars);
}

/**
 * Register a dependencies
 *
 * @param  {mixed}   component   Can be any variable.
 * @param  {string}  key         Name to set dependency as
 */
export function register(component, key)
{
    key = is_undefined(key) ? callable_name(component) : key;

    COMPONENT_CACHE[key] = component;
}
