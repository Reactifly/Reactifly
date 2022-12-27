import { patch } from './patch';
import { commit } from './commit';
import { is_empty, is_callable } from '../utils/index';

export function diff(left, right, callback)
{
	let actions = { current: [] };

    patch(left, right, actions.current);

    if (!is_empty(actions.current))
    {
        commit(actions.current);
    }

    if (is_callable(callback))
    {
    	callback.apply(null, actions.current);
    }
}