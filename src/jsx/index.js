import evaluate from './evaluate';
import { is_object, is_undefined } from '../utils/index';

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