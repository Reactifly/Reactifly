import { patch } from './patch';
import { commit } from './commit';
import { is_empty } from '../utils/index';

export function diff(left, right)
{    
	let actions = { current: [] };

    patch(left, right, actions.current);

    if (!is_empty(actions.current))
    {
        commit(actions.current);
    }
}