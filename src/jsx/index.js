import parse, { COMPONENT_CACHE } from './parser';
import { is_object, is_undefined, callable_name } from '../utils/index';

export function jsx(jsx, vars)
{
    if (!is_undefined(vars) && !is_object(vars))
    {
        throw new Error('Variables should be supplied to [jsx] as an object e.g [jsx("<div class={name} />", {name: "foo"})]');
    }

    return parse(jsx, vars);
}

export function register(component, key)
{
    key = is_undefined(key) ? callable_name(component) : key;

    COMPONENT_CACHE[key] = component;
}