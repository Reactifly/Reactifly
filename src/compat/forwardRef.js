import { cloneDeep } from '../utils/index';

/**
 * 
 * Pass ref down to a child. This is mainly used in libraries with HOCs that
 * wrap components. Using `forwardRef` there is an easy way to get a reference
 * of the wrapped component instead of one of the wrapper itself.
 * 
 * @param   {function} fn
 * @returns {function}
 */
export function forwardRef(fn)
{
	function Forwarded(props)
	{
		console.log(props);
		
		let clone = cloneDeep(props);

		delete clone.ref;
		
		return fn(clone, props.ref || null);
	}

	Forwarded.displayName = 'ForwardRef(' + (fn.displayName || fn.name) + ')';
	
	return Forwarded;
}

/**
 * Simple ref holder.
 * 
 * @returns {object}
 */
export function createRef()
{
	return { current: null };
}
