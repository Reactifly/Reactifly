import evaluate, {COMPONENT_CACHE} from './evaluate';
import { is_object, is_undefined, callable_name } from '../utils/index';

export function parseJSX(jsx, obj, config)
{
	return evaluate(jsx, obj, config);
}

export function jsx(str, vars)
{
	if (!is_undefined(vars) && !is_object(vars))
	{
		throw new Error('Variables should be supplied to [jsx] as an object e.g [jsx("<div class={name} />", {name: "foo"})]');
	}

	return evaluate(str, vars);
}

export function register(component, key)
{
	key = is_undefined(key) ? callable_name(component) : key;

	COMPONENT_CACHE[key] = component;
}